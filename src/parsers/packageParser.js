const fs = require('node:fs').promises;
const path = require('node:path');

/**
 * Parses package.json and package-lock.json files from a project directory
 */
class PackageParser {
  /**
   * Parse package.json file
   * @param {string} projectPath - Path to the project directory
   * @returns {Promise<Object>} Parsed package.json content
   */
  async parsePackageJson(projectPath) {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse package.json: ${error.message}`);
    }
  }

  /**
   * Parse package-lock.json file
   * @param {string} projectPath - Path to the project directory
   * @returns {Promise<Object|null>} Parsed package-lock.json content or null if not found
   */
  async parsePackageLock(projectPath) {
    try {
      const lockPath = path.join(projectPath, 'package-lock.json');
      const content = await fs.readFile(lockPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw new Error(`Failed to parse package-lock.json: ${error.message}`);
    }
  }

  /**
   * Extract all dependencies from package.json
   * @param {Object} packageJson - Parsed package.json object
   * @returns {Object} Combined dependencies object
   */
  extractDependencies(packageJson) {
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};
    const peerDependencies = packageJson.peerDependencies || {};
    const optionalDependencies = packageJson.optionalDependencies || {};

    return {
      dependencies,
      devDependencies,
      peerDependencies,
      optionalDependencies,
      all: {
        ...dependencies,
        ...devDependencies,
        ...optionalDependencies
      }
    };
  }

  /**
   * Extract installed package versions from package-lock.json
   * @param {Object} packageLock - Parsed package-lock.json object
   * @returns {Map<string, Object>} Map of package names to their metadata
   */
  extractInstalledPackages(packageLock) {
    const packages = new Map();

    if (!packageLock) {
      return packages;
    }

    // Handle npm v2 (lockfileVersion 2 and 3)
    if (packageLock.packages) {
      for (const [pkgPath, metadata] of Object.entries(packageLock.packages)) {
        // Skip root package (empty string key)
        if (pkgPath === '') {
          continue;
        }

        // Extract package name from path (remove node_modules/ prefix)
        const packageName = pkgPath.replace(/^node_modules\//, '');

        packages.set(packageName, {
          version: metadata.version,
          resolved: metadata.resolved,
          integrity: metadata.integrity,
          dependencies: metadata.dependencies || {},
          peerDependencies: metadata.peerDependencies || {},
          engines: metadata.engines || {},
          optional: metadata.optional || false,
          dev: metadata.dev || false
        });
      }
    } else if (packageLock.dependencies) {
      // Handle npm v1 (lockfileVersion 1) - legacy format
      this._extractLegacyDependencies(packageLock.dependencies, packages);
    }

    return packages;
  }

  /**
   * Recursively extract dependencies from legacy lockfile format
   * @private
   */
  _extractLegacyDependencies(dependencies, packages, prefix = '') {
    for (const [name, metadata] of Object.entries(dependencies)) {
      const fullName = prefix ? `${prefix}/node_modules/${name}` : name;

      packages.set(fullName, {
        version: metadata.version,
        resolved: metadata.resolved,
        integrity: metadata.integrity,
        dependencies: {},
        peerDependencies: {},
        engines: {},
        optional: metadata.optional || false,
        dev: metadata.dev || false
      });

      // Recursively process nested dependencies
      if (metadata.dependencies) {
        this._extractLegacyDependencies(metadata.dependencies, packages, fullName);
      }
    }
  }

  /**
   * Get project metadata including Node.js engine requirements
   * @param {Object} packageJson - Parsed package.json object
   * @returns {Object} Project metadata
   */
  extractProjectMetadata(packageJson) {
    return {
      name: packageJson.name || 'unknown',
      version: packageJson.version || '0.0.0',
      engines: packageJson.engines || {},
      type: packageJson.type || 'commonjs', // 'module' or 'commonjs'
      workspaces: packageJson.workspaces || null
    };
  }

  /**
   * Parse complete project information
   * @param {string} projectPath - Path to the project directory
   * @returns {Promise<Object>} Complete project information
   */
  async parseProject(projectPath) {
    const packageJson = await this.parsePackageJson(projectPath);
    const packageLock = await this.parsePackageLock(projectPath);

    return {
      metadata: this.extractProjectMetadata(packageJson),
      dependencies: this.extractDependencies(packageJson),
      installed: this.extractInstalledPackages(packageLock),
      hasLockFile: packageLock !== null
    };
  }
}

module.exports = PackageParser;
