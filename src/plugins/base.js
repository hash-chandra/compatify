/**
 * Base Plugin class that all language-specific plugins must extend
 * This provides the interface for multi-language support
 */
class BasePlugin {
  constructor() {
    this.name = 'base';
    this.language = 'unknown';
    this.manifestFiles = []; // e.g., ['package.json'], ['requirements.txt']
    this.lockFiles = []; // e.g., ['package-lock.json'], ['Pipfile.lock']
  }

  /**
   * Detect if this plugin's language is used in the project
   * @param {string} _projectPath - Path to the project directory
   * @returns {Promise<boolean>} True if the project uses this language
   */
  async detectProject(_projectPath) {
    throw new Error('detectProject() must be implemented by plugin');
  }

  /**
   * Get priority for this plugin (higher = checked first during auto-detection)
   * Useful when multiple manifest files exist (e.g., package.json + setup.py)
   * @returns {number} Priority value (0-100)
   */
  getPriority() {
    return 50; // Default priority
  }

  /**
   * Parse the project's manifest file(s)
   * @param {string} _projectPath - Path to the project directory
   * @returns {Promise<Object>} Parsed project data
   */
  async parseManifest(_projectPath) {
    throw new Error('parseManifest() must be implemented by plugin');
  }

  /**
   * Parse the project's lock file(s) if available
   * @param {string} _projectPath - Path to the project directory
   * @returns {Promise<Object|null>} Parsed lock file data or null
   */
  async parseLockFile(_projectPath) {
    return null; // Optional, can be overridden
  }

  /**
   * Fetch package information from the language's registry
   * @param {string} _packageName - Name of the package
   * @param {string} _version - Version to fetch
   * @returns {Promise<Object>} Package metadata
   */
  async fetchFromRegistry(_packageName, _version) {
    throw new Error('fetchFromRegistry() must be implemented by plugin');
  }

  /**
   * Load compatibility rules for this language
   * @returns {Promise<Object>} Compatibility rules object
   */
  async loadRules() {
    throw new Error('loadRules() must be implemented by plugin');
  }

  /**
   * Check compatibility issues in the project
   * @param {Object} _projectData - Parsed project data
   * @param {Object} _options - Check options
   * @returns {Promise<Object>} Compatibility check results
   */
  async checkCompatibility(_projectData, _options = {}) {
    throw new Error('checkCompatibility() must be implemented by plugin');
  }

  /**
   * Build dependency graph from project data
   * @param {Object} _projectData - Parsed project data
   * @returns {Object} Dependency graph
   */
  buildDependencyGraph(_projectData) {
    throw new Error('buildDependencyGraph() must be implemented by plugin');
  }

  /**
   * Get plugin metadata
   * @returns {Object} Plugin information
   */
  getInfo() {
    return {
      name: this.name,
      language: this.language,
      manifestFiles: this.manifestFiles,
      lockFiles: this.lockFiles,
      version: '1.0.0'
    };
  }

  /**
   * Validate that plugin is properly configured
   * @returns {boolean} True if valid
   */
  validate() {
    if (!this.name || this.name === 'base') {
      return false;
    }
    if (!this.language || this.language === 'unknown') {
      return false;
    }
    if (!this.manifestFiles || this.manifestFiles.length === 0) {
      return false;
    }
    return true;
  }
}

module.exports = BasePlugin;
