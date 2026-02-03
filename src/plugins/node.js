const fs = require('node:fs').promises;
const path = require('node:path');
const BasePlugin = require('./base');
const PackageParser = require('../parsers/packageParser');
const DependencyGraph = require('../graph/dependencyGraph');
const CompatibilityChecker = require('../checker/compatibilityChecker');
const NpmRegistry = require('../registry/npmRegistry');

/**
 * Node.js/npm plugin for compatibility checking
 */
class NodePlugin extends BasePlugin {
  constructor() {
    super();
    this.name = 'node';
    this.language = 'nodejs';
    this.manifestFiles = ['package.json'];
    this.lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
    
    this.parser = new PackageParser();
    this.registry = new NpmRegistry();
  }

  /**
   * Detect if this is a Node.js project by checking for package.json
   * @param {string} projectPath - Path to the project directory
   * @returns {Promise<boolean>} True if package.json exists
   */
  async detectProject(projectPath) {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      await fs.access(packageJsonPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Node.js projects get high priority since many projects use npm
   * @returns {number} Priority value (70 for Node.js)
   */
  getPriority() {
    return 70;
  }

  /**
   * Parse package.json and related files
   * @param {string} projectPath - Path to the project directory
   * @returns {Promise<Object>} Parsed project data
   */
  async parseManifest(projectPath) {
    try {
      return await this.parser.parseProject(projectPath);
    } catch (error) {
      throw new Error(`Failed to parse Node.js project: ${error.message}`);
    }
  }

  /**
   * Parse lock file (package-lock.json, yarn.lock, or pnpm-lock.yaml)
   * @param {string} projectPath - Path to the project directory
   * @returns {Promise<Object|null>} Parsed lock file data or null
   */
  async parseLockFile(projectPath) {
    try {
      return await this.parser.parsePackageLock(projectPath);
    } catch {
      return null;
    }
  }

  /**
   * Fetch package information from npm registry
   * @param {string} packageName - Name of the npm package
   * @param {string} version - Version to fetch
   * @returns {Promise<Object>} Package metadata
   */
  async fetchFromRegistry(packageName, version) {
    try {
      return await this.registry.getPackageInfo(packageName, version);
    } catch (error) {
      throw new Error(`Failed to fetch ${packageName}@${version} from npm: ${error.message}`);
    }
  }

  /**
   * Load Node.js-specific compatibility rules
   * @returns {Promise<Object>} Compatibility rules object
   */
  async loadRules() {
    const rulesPath = path.join(__dirname, '../../data/rules-node.json');
    try {
      const content = await fs.readFile(rulesPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load Node.js rules: ${error.message}`);
    }
  }

  /**
   * Build dependency graph from Node.js project data
   * @param {Object} projectData - Parsed project data
   * @returns {Object} Dependency graph
   */
  buildDependencyGraph(projectData) {
    return DependencyGraph.buildFromProject(projectData);
  }

  /**
   * Check compatibility issues in Node.js project
   * @param {Object} projectData - Parsed project data
   * @param {Object} options - Check options
   * @returns {Promise<Object>} Compatibility check results
   */
  async checkCompatibility(projectData, options = {}) {
    try {
      const graph = this.buildDependencyGraph(projectData);
      
      const checker = new CompatibilityChecker(options.rulesPath);
      const issues = await checker.check(graph, projectData.metadata);
      
      return {
        issues,
        summary: checker.getSummary(),
        metadata: projectData.metadata,
        graph: {
          stats: graph.getStats(),
          packages: graph.getAllPackages()
        }
      };
    } catch (error) {
      throw new Error(`Failed to check Node.js compatibility: ${error.message}`);
    }
  }

  /**
   * Get plugin info with Node.js-specific details
   * @returns {Object} Plugin information
   */
  getInfo() {
    return {
      ...super.getInfo(),
      description: 'Node.js/npm dependency compatibility checker',
      registry: 'https://registry.npmjs.org',
      supportedLockFiles: this.lockFiles
    };
  }
}

module.exports = NodePlugin;
