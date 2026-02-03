const DependencyGraph = require('../src/graph/dependencyGraph');

describe('DependencyGraph', () => {
  let graph;

  beforeEach(() => {
    graph = new DependencyGraph();
  });

  describe('addNode and getNode', () => {
    test('should add and retrieve node', () => {
      const metadata = {
        version: '1.0.0',
        peerDependencies: {},
        engines: { node: '>=14.0.0' }
      };

      graph.addNode('test-package', metadata);

      const node = graph.getNode('test-package');
      expect(node).toBeDefined();
      expect(node.name).toBe('test-package');
      expect(node.version).toBe('1.0.0');
      expect(node.engines.node).toBe('>=14.0.0');
    });

    test('should return null for non-existent node', () => {
      const node = graph.getNode('non-existent');
      expect(node).toBeNull();
    });
  });

  describe('addEdge and getDependencies', () => {
    test('should add and retrieve edges', () => {
      graph.addNode('pkg-a', { version: '1.0.0' });
      graph.addNode('pkg-b', { version: '2.0.0' });

      graph.addEdge('pkg-a', 'pkg-b', '^2.0.0');

      const deps = graph.getDependencies('pkg-a');
      expect(deps).toHaveLength(1);
      expect(deps[0].to).toBe('pkg-b');
      expect(deps[0].versionRange).toBe('^2.0.0');
    });

    test('should handle multiple edges from same node', () => {
      graph.addNode('pkg-a', { version: '1.0.0' });
      graph.addNode('pkg-b', { version: '2.0.0' });
      graph.addNode('pkg-c', { version: '3.0.0' });

      graph.addEdge('pkg-a', 'pkg-b', '^2.0.0');
      graph.addEdge('pkg-a', 'pkg-c', '^3.0.0');

      const deps = graph.getDependencies('pkg-a');
      expect(deps).toHaveLength(2);
    });
  });

  describe('getDependents', () => {
    test('should find all packages that depend on a package', () => {
      graph.addNode('pkg-a', { version: '1.0.0' });
      graph.addNode('pkg-b', { version: '2.0.0' });
      graph.addNode('pkg-c', { version: '3.0.0' });

      graph.addEdge('pkg-a', 'pkg-c', '^3.0.0');
      graph.addEdge('pkg-b', 'pkg-c', '^3.0.0');

      const dependents = graph.getDependents('pkg-c');
      expect(dependents).toHaveLength(2);
      expect(dependents).toContain('pkg-a');
      expect(dependents).toContain('pkg-b');
    });
  });

  describe('getAllPackages', () => {
    test('should return all packages except __root__', () => {
      graph.addNode('__root__', { version: '1.0.0' });
      graph.addNode('pkg-a', { version: '1.0.0' });
      graph.addNode('pkg-b', { version: '2.0.0' });

      const packages = graph.getAllPackages();
      expect(packages).toHaveLength(2);
      expect(packages).toContain('pkg-a');
      expect(packages).toContain('pkg-b');
      expect(packages).not.toContain('__root__');
    });
  });

  describe('buildFromProject', () => {
    test('should build graph from project data', () => {
      const projectData = {
        metadata: {
          version: '1.0.0',
          engines: { node: '>=14.0.0' },
          type: 'commonjs'
        },
        dependencies: {
          all: {
            'react': '^18.0.0',
            'react-dom': '^18.0.0'
          }
        },
        installed: new Map([
          ['react', {
            version: '18.0.0',
            dependencies: { 'loose-envify': '^1.1.0' },
            peerDependencies: {}
          }],
          ['react-dom', {
            version: '18.0.0',
            dependencies: {},
            peerDependencies: { 'react': '^18.0.0' }
          }]
        ])
      };

      const graph = DependencyGraph.buildFromProject(projectData);

      expect(graph.getNode('react')).toBeDefined();
      expect(graph.getNode('react-dom')).toBeDefined();
      expect(graph.getDependencies('__root__')).toHaveLength(2);
    });
  });

  describe('getStats', () => {
    test('should calculate graph statistics', () => {
      const projectData = {
        metadata: {
          version: '1.0.0',
          engines: {},
          type: 'commonjs'
        },
        dependencies: {
          all: {
            'pkg-a': '^1.0.0',
            'pkg-b': '^2.0.0'
          }
        },
        installed: new Map([
          ['pkg-a', { version: '1.0.0', dependencies: {}, dev: false }],
          ['pkg-b', { version: '2.0.0', dependencies: {}, dev: true }],
          ['pkg-c', { version: '3.0.0', dependencies: {}, dev: false }]
        ])
      };

      const graph = DependencyGraph.buildFromProject(projectData);
      const stats = graph.getStats();

      expect(stats.totalPackages).toBe(3);
      expect(stats.directDependencies).toBe(2);
      expect(stats.transitiveDependencies).toBe(1);
    });
  });

  describe('findPaths', () => {
    test('should find path between two packages', () => {
      graph.addNode('pkg-a', { version: '1.0.0' });
      graph.addNode('pkg-b', { version: '2.0.0' });
      graph.addNode('pkg-c', { version: '3.0.0' });

      graph.addEdge('pkg-a', 'pkg-b', '^2.0.0');
      graph.addEdge('pkg-b', 'pkg-c', '^3.0.0');

      const paths = graph.findPaths('pkg-a', 'pkg-c');
      expect(paths).toHaveLength(1);
      expect(paths[0]).toEqual(['pkg-a', 'pkg-b', 'pkg-c']);
    });

    test('should return empty array if no path exists', () => {
      graph.addNode('pkg-a', { version: '1.0.0' });
      graph.addNode('pkg-b', { version: '2.0.0' });

      const paths = graph.findPaths('pkg-a', 'pkg-b');
      expect(paths).toHaveLength(0);
    });
  });
});
