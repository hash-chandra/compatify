const fs = require('node:fs').promises;
const path = require('node:path');
const os = require('node:os');
const pacote = require('pacote');

/**
 * Handles fetching package metadata from npm registry with caching
 */
class NpmRegistry {
  constructor(options = {}) {
    this.cacheDir = options.cacheDir || path.join(os.homedir(), '.compatify-cache');
    this.cacheTTL = options.cacheTTL || 86400000; // 24 hours in milliseconds
    this.useCache = options.useCache !== false;
  }

  /**
   * Initialize cache directory
   */
  async initCache() {
    if (!this.useCache) {
      return;
    }

    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.warn(`Warning: Could not create cache directory: ${error.message}`);
      this.useCache = false;
    }
  }

  /**
   * Get cache file path for a package
   * @private
   */
  _getCachePath(packageName, version = 'latest') {
    const safeName = packageName.replaceAll('/', '-');
    return path.join(this.cacheDir, `${safeName}-${version}.json`);
  }

  /**
   * Check if cached data is still valid
   * @private
   */
  async _isCacheValid(cachePath) {
    if (!this.useCache) {
      return false;
    }

    try {
      const stats = await fs.stat(cachePath);
      const age = Date.now() - stats.mtimeMs;
      return age < this.cacheTTL;
    } catch {
      return false;
    }
  }

  /**
   * Read from cache
   * @private
   */
  async _readCache(cachePath) {
    try {
      const content = await fs.readFile(cachePath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Write to cache
   * @private
   */
  async _writeCache(cachePath, data) {
    if (!this.useCache) {
      return;
    }

    try {
      await fs.writeFile(cachePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.warn(`Warning: Could not write to cache: ${error.message}`);
    }
  }

  /**
   * Fetch package manifest from npm registry
   * @param {string} packageName - Package name
   * @param {string} version - Package version (default: 'latest')
   * @returns {Promise<Object>} Package manifest
   */
  async fetchPackageManifest(packageName, version = 'latest') {
    await this.initCache();

    const cachePath = this._getCachePath(packageName, version);

    // Check cache first
    if (await this._isCacheValid(cachePath)) {
      const cached = await this._readCache(cachePath);
      if (cached) {
        return cached;
      }
    }

    // Fetch from registry
    try {
      const manifest = await pacote.manifest(`${packageName}@${version}`);

      const data = {
        name: manifest.name,
        version: manifest.version,
        dependencies: manifest.dependencies || {},
        devDependencies: manifest.devDependencies || {},
        peerDependencies: manifest.peerDependencies || {},
        peerDependenciesMeta: manifest.peerDependenciesMeta || {},
        optionalDependencies: manifest.optionalDependencies || {},
        engines: manifest.engines || {},
        deprecated: manifest.deprecated || false,
        type: manifest.type,
        exports: manifest.exports,
        main: manifest.main,
        module: manifest.module
      };

      // Cache the result
      await this._writeCache(cachePath, data);

      return data;
    } catch (error) {
      throw new Error(`Failed to fetch ${packageName}@${version}: ${error.message}`);
    }
  }

  /**
   * Fetch all versions of a package
   * @param {string} packageName - Package name
   * @returns {Promise<Array>} Array of version strings
   */
  async fetchPackageVersions(packageName) {
    try {
      const packument = await pacote.packument(packageName);
      return Object.keys(packument.versions);
    } catch (error) {
      throw new Error(`Failed to fetch versions for ${packageName}: ${error.message}`);
    }
  }

  /**
   * Fetch latest version of a package
   * @param {string} packageName - Package name
   * @returns {Promise<string>} Latest version string
   */
  async fetchLatestVersion(packageName) {
    try {
      const manifest = await this.fetchPackageManifest(packageName, 'latest');
      return manifest.version;
    } catch (error) {
      throw new Error(`Failed to fetch latest version for ${packageName}: ${error.message}`);
    }
  }

  /**
   * Fetch metadata for multiple packages in parallel
   * @param {Array<{name: string, version: string}>} packages - Array of package specs
   * @returns {Promise<Map>} Map of package names to manifests
   */
  async fetchMultiplePackages(packages) {
    const results = new Map();

    const promises = packages.map(async ({ name, version }) => {
      try {
        const manifest = await this.fetchPackageManifest(name, version);
        results.set(name, manifest);
      } catch (error) {
        console.warn(`Warning: Failed to fetch ${name}@${version}: ${error.message}`);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Clear cache for a specific package or all packages
   * @param {string|null} packageName - Package name or null for all
   */
  async clearCache(packageName = null) {
    if (!this.useCache) {
      return;
    }

    try {
      if (packageName) {
        const safeName = packageName.replaceAll('/', '-');
        const files = await fs.readdir(this.cacheDir);
        const toDelete = files.filter(f => f.startsWith(safeName));

        await Promise.all(
          toDelete.map(f => fs.unlink(path.join(this.cacheDir, f)))
        );
      } else {
        // Clear entire cache directory
        await fs.rm(this.cacheDir, { recursive: true, force: true });
        await this.initCache();
      }
    } catch (error) {
      console.warn(`Warning: Failed to clear cache: ${error.message}`);
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache stats
   */
  async getCacheStats() {
    if (!this.useCache) {
      return { enabled: false };
    }

    try {
      const files = await fs.readdir(this.cacheDir);
      let totalSize = 0;

      for (const file of files) {
        const stats = await fs.stat(path.join(this.cacheDir, file));
        totalSize += stats.size;
      }

      return {
        enabled: true,
        files: files.length,
        totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        path: this.cacheDir
      };
    } catch {
      return { enabled: true, files: 0, totalSize: 0 };
    }
  }
}

module.exports = NpmRegistry;
