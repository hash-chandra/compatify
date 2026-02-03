/**
 * Builds and manages dependency graph for a Node.js project
 */
class DependencyGraph {
  constructor() {
    this.nodes = new Map(); // package -> node metadata
    this.edges = new Map(); // package -> [dependencies]
  }

  /**
   * Add a package node to the graph
   * @param {string} name - Package name
   * @param {Object} metadata - Package metadata
   */
  addNode(name, metadata) {
    this.nodes.set(name, {
      name,
      version: metadata.version,
      peerDependencies: metadata.peerDependencies || {},
      engines: metadata.engines || {},
      type: metadata.type || 'commonjs',
      deprecated: metadata.deprecated || false,
      optional: metadata.optional || false,
      dev: metadata.dev || false
    });
  }

  /**
   * Add a dependency edge between two packages
   * @param {string} from - Dependent package name
   * @param {string} to - Dependency package name
   * @param {string} versionRange - Required version range
   */
  addEdge(from, to, versionRange) {
    if (!this.edges.has(from)) {
      this.edges.set(from, []);
    }
    
    this.edges.get(from).push({
      to,
      versionRange
    });
  }

  /**
   * Build dependency graph from parsed project data
   * @param {Object} projectData - Data from PackageParser.parseProject()
   * @returns {DependencyGraph} The constructed graph
   */
  static buildFromProject(projectData) {
    const graph = new DependencyGraph();
    
    // Add root project node
    graph.addNode('__root__', {
      version: projectData.metadata.version,
      engines: projectData.metadata.engines,
      type: projectData.metadata.type
    });

    // Add all installed packages as nodes
    for (const [name, metadata] of projectData.installed) {
      graph.addNode(name, metadata);
    }

    // Add edges from root to direct dependencies
    const allDeps = projectData.dependencies.all;
    for (const [name, versionRange] of Object.entries(allDeps)) {
      graph.addEdge('__root__', name, versionRange);
    }

    // Add edges for transitive dependencies
    for (const [name, metadata] of projectData.installed) {
      if (metadata.dependencies) {
        for (const [depName, versionRange] of Object.entries(metadata.dependencies)) {
          graph.addEdge(name, depName, versionRange);
        }
      }
    }

    return graph;
  }

  /**
   * Get all dependencies of a package (direct only)
   * @param {string} packageName - Package name
   * @returns {Array} Array of dependency objects
   */
  getDependencies(packageName) {
    return this.edges.get(packageName) || [];
  }

  /**
   * Get all packages that depend on a given package
   * @param {string} packageName - Package name
   * @returns {Array} Array of dependent package names
   */
  getDependents(packageName) {
    const dependents = [];
    
    for (const [from, edges] of this.edges) {
      if (edges.some(edge => edge.to === packageName)) {
        dependents.push(from);
      }
    }
    
    return dependents;
  }

  /**
   * Get package metadata
   * @param {string} packageName - Package name
   * @returns {Object|null} Package metadata or null if not found
   */
  getNode(packageName) {
    return this.nodes.get(packageName) || null;
  }

  /**
   * Get all package names in the graph
   * @returns {Array<string>} Array of package names
   */
  getAllPackages() {
    return Array.from(this.nodes.keys()).filter(name => name !== '__root__');
  }

  /**
   * Find all paths from one package to another (for debugging circular deps)
   * @param {string} from - Starting package
   * @param {string} to - Target package
   * @param {number} maxDepth - Maximum search depth (default 10)
   * @returns {Array<Array<string>>} Array of paths (each path is array of package names)
   */
  findPaths(from, to, maxDepth = 10) {
    const paths = [];
    const visited = new Set();

    const dfs = (current, path, depth) => {
      if (depth > maxDepth) return;
      
      if (current === to) {
        paths.push([...path, current]);
        return;
      }

      if (visited.has(current)) return;
      visited.add(current);

      const deps = this.getDependencies(current);
      for (const dep of deps) {
        dfs(dep.to, [...path, current], depth + 1);
      }

      visited.delete(current);
    };

    dfs(from, [], 0);
    return paths;
  }

  /**
   * Get statistics about the dependency graph
   * @returns {Object} Graph statistics
   */
  getStats() {
    const packages = this.getAllPackages();
    const totalDeps = packages.length;
    
    let directDeps = 0;
    let devDeps = 0;
    let optionalDeps = 0;
    
    for (const pkg of packages) {
      const node = this.getNode(pkg);
      if (node) {
        if (node.dev) devDeps++;
        if (node.optional) optionalDeps++;
      }
    }

    // Count direct dependencies from root
    const rootDeps = this.getDependencies('__root__');
    directDeps = rootDeps.length;

    return {
      totalPackages: totalDeps,
      directDependencies: directDeps,
      transitiveDependencies: totalDeps - directDeps,
      devDependencies: devDeps,
      optionalDependencies: optionalDeps
    };
  }
}

module.exports = DependencyGraph;
