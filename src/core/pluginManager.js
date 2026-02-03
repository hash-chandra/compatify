/**
 * Plugin Manager - Handles registration, detection, and loading of language plugins
 */
class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.registeredLanguages = new Set();
  }

  /**
   * Register a plugin
   * @param {BasePlugin} plugin - Plugin instance to register
   */
  register(plugin) {
    if (!plugin.validate()) {
      throw new Error(`Invalid plugin: ${plugin.name}`);
    }

    if (this.plugins.has(plugin.language)) {
      throw new Error(`Plugin for '${plugin.language}' is already registered`);
    }

    this.plugins.set(plugin.language, plugin);
    this.registeredLanguages.add(plugin.language);
  }

  /**
   * Get a plugin by language name
   * @param {string} language - Language identifier (e.g., 'nodejs', 'python')
   * @returns {BasePlugin|null} Plugin instance or null if not found
   */
  getPlugin(language) {
    return this.plugins.get(language) || null;
  }

  /**
   * Get all registered plugins
   * @returns {Array<BasePlugin>} Array of plugin instances
   */
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  /**
   * Get list of supported languages
   * @returns {Array<string>} Array of language names
   */
  getSupportedLanguages() {
    return Array.from(this.registeredLanguages);
  }

  /**
   * Auto-detect which plugin(s) match the project
   * @param {string} projectPath - Path to the project directory
   * @returns {Promise<Array<Object>>} Array of matching plugins with priority
   */
  async detectPlugins(projectPath) {
    const matches = [];

    for (const plugin of this.plugins.values()) {
      try {
        const isMatch = await plugin.detectProject(projectPath);
        if (isMatch) {
          matches.push({
            plugin,
            language: plugin.language,
            priority: plugin.getPriority()
          });
        }
      } catch {
        // Silently skip plugins that fail detection
        continue;
      }
    }

    // Sort by priority (highest first)
    matches.sort((a, b) => b.priority - a.priority);
    return matches;
  }

  /**
   * Get the best matching plugin for a project
   * @param {string} projectPath - Path to the project directory
   * @param {string|null} preferredLanguage - Optional language preference
   * @returns {Promise<BasePlugin|null>} Best matching plugin or null
   */
  async getBestPlugin(projectPath, preferredLanguage = null) {
    // If language is specified, try that first
    if (preferredLanguage) {
      const plugin = this.getPlugin(preferredLanguage);
      if (plugin) {
        const isMatch = await plugin.detectProject(projectPath);
        if (isMatch) {
          return plugin;
        }
        throw new Error(`Project at '${projectPath}' does not appear to be a ${preferredLanguage} project`);
      }
      throw new Error(`No plugin registered for language: ${preferredLanguage}`);
    }

    // Auto-detect the best match
    const matches = await this.detectPlugins(projectPath);
    
    if (matches.length === 0) {
      return null;
    }

    // Return the highest priority match
    return matches[0].plugin;
  }

  /**
   * Check compatibility using the appropriate plugin
   * @param {string} projectPath - Path to the project directory
   * @param {Object} options - Check options
   * @param {string|null} options.language - Optional language preference
   * @returns {Promise<Object>} Compatibility check results
   */
  async checkCompatibility(projectPath, options = {}) {
    const plugin = await this.getBestPlugin(projectPath, options.language);
    
    if (!plugin) {
      const supported = this.getSupportedLanguages().join(', ');
      throw new Error(
        `Could not detect project type. Supported languages: ${supported}\n` +
        'Use --language flag to specify explicitly.'
      );
    }

    // Parse the project
    const projectData = await plugin.parseManifest(projectPath);
    
    // Run compatibility checks
    const results = await plugin.checkCompatibility(projectData, options);
    
    // Add plugin info to results
    return {
      ...results,
      plugin: {
        language: plugin.language,
        name: plugin.name
      }
    };
  }

  /**
   * Get information about all registered plugins
   * @returns {Array<Object>} Array of plugin info objects
   */
  getPluginsInfo() {
    return this.getAllPlugins().map(plugin => plugin.getInfo());
  }
}

module.exports = PluginManager;
