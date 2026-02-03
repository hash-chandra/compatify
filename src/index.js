const PackageParser = require('./parsers/packageParser');
const DependencyGraph = require('./graph/dependencyGraph');
const CompatibilityChecker = require('./checker/compatibilityChecker');
const NpmRegistry = require('./registry/npmRegistry');

/**
 * Main entry point for programmatic usage
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
  PackageParser,
  DependencyGraph,
  CompatibilityChecker,
  NpmRegistry,
  checkCompatibility
};
