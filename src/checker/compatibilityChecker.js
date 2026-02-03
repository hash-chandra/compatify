const fs = require('node:fs').promises;
const path = require('node:path');
const semver = require('semver');

/**
 * Compatibility checker that evaluates dependencies against compatibility rules
 */
class CompatibilityChecker {
  constructor(rulesPath = null) {
    this.rules = null;
    this.rulesPath = rulesPath || path.join(__dirname, '../../data/rules.json');
    this.issues = [];
  }

  /**
   * Load compatibility rules from JSON file
   */
  async loadRules() {
    try {
      const content = await fs.readFile(this.rulesPath, 'utf8');
      this.rules = JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load compatibility rules: ${error.message}`);
    }
  }

  /**
   * Check all compatibility issues in a dependency graph
   * @param {DependencyGraph} graph - The dependency graph to check
   * @param {Object} projectMetadata - Project metadata from parser
   * @returns {Promise<Array>} Array of compatibility issues
   */
  async check(graph, projectMetadata) {
    if (!this.rules) {
      await this.loadRules();
    }

    this.issues = [];

    // Check peer dependencies
    this.checkPeerDependencies(graph);

    // Check version incompatibilities
    this.checkVersionIncompatibilities(graph);

    // Check deprecated packages
    this.checkDeprecatedPackages(graph);

    // Check ESM/CommonJS issues
    this.checkESMCompatibility(graph, projectMetadata);

    // Check Node.js engine requirements
    this.checkEngineRequirements(graph, projectMetadata);

    return this.issues;
  }

  /**
   * Check peer dependency conflicts
   * @private
   */
  checkPeerDependencies(graph) {
    for (const packageName of graph.getAllPackages()) {
      const node = graph.getNode(packageName);
      if (!node || !node.peerDependencies) {
        continue;
      }

      for (const [peerName, peerRange] of Object.entries(node.peerDependencies)) {
        const peerNode = graph.getNode(peerName);

        if (!peerNode) {
          this.issues.push({
            type: 'missing-peer-dependency',
            severity: 'error',
            package: packageName,
            peerPackage: peerName,
            requiredVersion: peerRange,
            message: `${packageName}@${node.version} requires peer dependency ${peerName}@${peerRange} but it is not installed`,
            fix: `npm install ${peerName}@${peerRange}`
          });
          continue;
        }

        if (!semver.satisfies(peerNode.version, peerRange)) {
          this.issues.push({
            type: 'peer-dependency-mismatch',
            severity: 'error',
            package: packageName,
            peerPackage: peerName,
            requiredVersion: peerRange,
            installedVersion: peerNode.version,
            message: `${packageName}@${node.version} requires ${peerName}@${peerRange} but found ${peerName}@${peerNode.version}`,
            fix: `npm install ${peerName}@${peerRange}`
          });
        }
      }
    }
  }

  /**
   * Check version incompatibilities from rules database
   * @private
   */
  checkVersionIncompatibilities(graph) {
    if (!this.rules.rules) {
      return;
    }

    for (const rule of this.rules.rules) {
      const node = graph.getNode(rule.package);
      if (!node) {
        continue;
      }

      // Check if package version matches rule version
      if (!semver.satisfies(node.version, rule.version)) {
        continue;
      }

      // Check incompatibilities
      if (rule.incompatibleWith) {
        for (const incompatibility of rule.incompatibleWith) {
          const incompatNode = graph.getNode(incompatibility.package);
          if (!incompatNode) {
            continue;
          }

          if (semver.satisfies(incompatNode.version, incompatibility.versionRange)) {
            this.issues.push({
              type: 'version-incompatibility',
              severity: incompatibility.severity || 'error',
              package: rule.package,
              version: node.version,
              incompatiblePackage: incompatibility.package,
              incompatibleVersion: incompatNode.version,
              message: incompatibility.reason,
              fix: incompatibility.fix
            });
          }
        }
      }

      // Check warnings
      if (rule.warnings) {
        for (const warning of rule.warnings) {
          // Evaluate condition (simple node version check for now)
          if (warning.condition && this._evaluateCondition(warning.condition)) {
            this.issues.push({
              type: 'compatibility-warning',
              severity: warning.severity || 'warning',
              package: rule.package,
              version: node.version,
              message: warning.message
            });
          }
        }
      }
    }
  }

  /**
   * Check for deprecated packages
   * @private
   */
  checkDeprecatedPackages(graph) {
    if (!this.rules.deprecated) {
      return;
    }

    for (const deprecation of this.rules.deprecated) {
      const node = graph.getNode(deprecation.package);
      if (!node) {
        continue;
      }

      this.issues.push({
        type: 'deprecated-package',
        severity: deprecation.severity || 'warning',
        package: deprecation.package,
        version: node.version,
        message: deprecation.reason,
        replacement: deprecation.replacement,
        fix: deprecation.fix
      });
    }
  }

  /**
   * Check ESM/CommonJS compatibility issues
   * @private
   */
  checkESMCompatibility(graph, projectMetadata) {
    if (!this.rules.esm) {
      return;
    }

    const projectType = projectMetadata.type || 'commonjs';

    // Only check if project is CommonJS
    if (projectType !== 'commonjs') {
      return;
    }

    for (const esmRule of this.rules.esm) {
      const node = graph.getNode(esmRule.package);
      if (!node) {
        continue;
      }

      if (semver.satisfies(node.version, esmRule.version)) {
        this.issues.push({
          type: 'esm-commonjs-conflict',
          severity: esmRule.severity || 'error',
          package: esmRule.package,
          version: node.version,
          message: esmRule.message,
          compatibleVersion: esmRule.compatibleVersion,
          fix: `npm install ${esmRule.package}@${esmRule.compatibleVersion}`
        });
      }
    }
  }

  /**
   * Check Node.js engine requirements
   * @private
   */
  checkEngineRequirements(graph, projectMetadata) {
    const currentNodeVersion = process.version.replace('v', '');

    // Check project's engine requirements
    if (projectMetadata.engines && projectMetadata.engines.node) {
      if (!semver.satisfies(currentNodeVersion, projectMetadata.engines.node)) {
        this.issues.push({
          type: 'engine-mismatch',
          severity: 'error',
          package: projectMetadata.name,
          requiredNodeVersion: projectMetadata.engines.node,
          currentNodeVersion,
          message: `Project requires Node.js ${projectMetadata.engines.node} but current version is ${currentNodeVersion}`
        });
      }
    }

    // Check each package's engine requirements
    for (const packageName of graph.getAllPackages()) {
      const node = graph.getNode(packageName);
      if (!node || !node.engines || !node.engines.node) {
        continue;
      }

      if (!semver.satisfies(currentNodeVersion, node.engines.node)) {
        this.issues.push({
          type: 'engine-mismatch',
          severity: 'warning',
          package: packageName,
          version: node.version,
          requiredNodeVersion: node.engines.node,
          currentNodeVersion,
          message: `${packageName}@${node.version} requires Node.js ${node.engines.node} but current version is ${currentNodeVersion}`
        });
      }
    }

    // Check Node.js version status (EOL warnings)
    if (this.rules.engineRequirements && this.rules.engineRequirements.node) {
      const majorVersion = semver.major(currentNodeVersion);
      const nodeInfo = this.rules.engineRequirements.node[majorVersion];

      if (nodeInfo && nodeInfo.status === 'end-of-life') {
        this.issues.push({
          type: 'node-version-eol',
          severity: nodeInfo.severity || 'warning',
          currentNodeVersion,
          eolDate: nodeInfo.eolDate,
          message: nodeInfo.message
        });
      }
    }
  }

  /**
   * Evaluate a simple condition string (e.g., "node<16.0.0")
   * @private
   */
  _evaluateCondition(condition) {
    // Simple regex to parse conditions like "node<16.0.0"
    const match = condition.match(/^node([<>=!]+)(.+)$/);
    if (!match) {
      return false;
    }

    const operator = match[1];
    const version = match[2];
    const currentVersion = process.version.replace('v', '');

    try {
      return semver.satisfies(currentVersion, `${operator}${version}`);
    } catch {
      return false;
    }
  }

  /**
   * Get issues grouped by severity
   * @returns {Object} Issues grouped by severity
   */
  getIssuesBySeverity() {
    const grouped = {
      error: [],
      warning: [],
      info: []
    };

    for (const issue of this.issues) {
      const severity = issue.severity || 'warning';
      if (grouped[severity]) {
        grouped[severity].push(issue);
      }
    }

    return grouped;
  }

  /**
   * Get summary statistics
   * @returns {Object} Summary stats
   */
  getSummary() {
    const bySeverity = this.getIssuesBySeverity();

    return {
      total: this.issues.length,
      errors: bySeverity.error.length,
      warnings: bySeverity.warning.length,
      info: bySeverity.info.length,
      types: {
        peerDependency: this.issues.filter(i => i.type.includes('peer-dependency')).length,
        versionIncompatibility: this.issues.filter(i => i.type === 'version-incompatibility').length,
        deprecated: this.issues.filter(i => i.type === 'deprecated-package').length,
        esm: this.issues.filter(i => i.type === 'esm-commonjs-conflict').length,
        engine: this.issues.filter(i => i.type.includes('engine') || i.type.includes('node-version')).length
      }
    };
  }
}

module.exports = CompatibilityChecker;
