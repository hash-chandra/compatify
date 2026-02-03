const PackageParser = require('./parsers/packageParser');
const DependencyGraph = require('./graph/dependencyGraph');
const CompatibilityChecker = require('./checker/compatibilityChecker');
const NpmRegistry = require('./registry/npmRegistry');

/**
 * Check Node.js project for dependency compatibility issues
 * @param {string} projectPath - Path to the project directory
 * @param {Object} options - Check options
 * @param {string} options.rulesPath - Optional custom rules path
 * @returns {Promise<Object>} Compatibility check results
 */
async function checkCompatibility(projectPath, options = {}) {
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
  checkCompatibility,
  PackageParser,
  DependencyGraph,
  CompatibilityChecker,
  NpmRegistry
};
