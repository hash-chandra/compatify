const PluginManager = require('./core/pluginManager');
const NodePlugin = require('./plugins/node');

// Legacy exports for backward compatibility
const PackageParser = require('./parsers/packageParser');
const DependencyGraph = require('./graph/dependencyGraph');
const CompatibilityChecker = require('./checker/compatibilityChecker');
const NpmRegistry = require('./registry/npmRegistry');

// Initialize plugin manager with default plugins
const pluginManager = new PluginManager();
pluginManager.register(new NodePlugin());

/**
 * Main entry point for programmatic usage with plugin support
 * @param {string} projectPath - Path to the project directory
 * @param {Object} options - Check options
 * @param {string} options.language - Optional language preference ('nodejs', 'python', etc.)
 * @param {string} options.rulesPath - Optional custom rules path
 * @returns {Promise<Object>} Compatibility check results
 */
async function checkCompatibility(projectPath, options = {}) {
  return await pluginManager.checkCompatibility(projectPath, options);
}

/**
 * Legacy function for backward compatibility (Node.js only)
 * @deprecated Use checkCompatibility with auto-detection instead
 */
async function checkNodeCompatibility(projectPath, options = {}) {
  const parser = new PackageParser();
  const projectData = await parser.parseProject(projectPath);
  
  const graph = DependencyGraph.buildFromProject(projectData);
  
  const checker = new CompatibilityChecker(options.rulesPath);
  const issues = await checker.check(graph, projectData.metadata);
  
  return {
    issues,
    summary: checker.getSummary(),
    metadata: projectData.metadata
  };
}

module.exports = {
  // New plugin-based API
  checkCompatibility,
  pluginManager,
  
  // Legacy exports for backward compatibility
  PackageParser,
  DependencyGraph,
  CompatibilityChecker,
  NpmRegistry,
  checkNodeCompatibility
};
