const CompatibilityChecker = require('../src/checker/compatibilityChecker');
const DependencyGraph = require('../src/graph/dependencyGraph');
const path = require('node:path');

describe('CompatibilityChecker', () => {
  let checker;
  let graph;

  beforeEach(async () => {
    checker = new CompatibilityChecker();
    checker.rulesPath = path.join(__dirname, '../data/rules.json');
    await checker.loadRules();
    graph = new DependencyGraph();
  });

  describe('checkPeerDependencies', () => {
    test('should detect missing peer dependency', () => {
      graph.addNode('react-dom', {
        version: '18.0.0',
        peerDependencies: { 'react': '^18.0.0' }
      });

      checker.checkPeerDependencies(graph);
      
      expect(checker.issues).toHaveLength(1);
      expect(checker.issues[0].type).toBe('missing-peer-dependency');
      expect(checker.issues[0].severity).toBe('error');
    });

    test('should detect peer dependency version mismatch', () => {
      graph.addNode('react', { version: '17.0.0', peerDependencies: {} });
      graph.addNode('react-dom', {
        version: '18.0.0',
        peerDependencies: { 'react': '^18.0.0' }
      });

      checker.checkPeerDependencies(graph);
      
      expect(checker.issues).toHaveLength(1);
      expect(checker.issues[0].type).toBe('peer-dependency-mismatch');
      expect(checker.issues[0].installedVersion).toBe('17.0.0');
    });

    test('should pass when peer dependencies are satisfied', () => {
      graph.addNode('react', { version: '18.2.0', peerDependencies: {} });
      graph.addNode('react-dom', {
        version: '18.0.0',
        peerDependencies: { 'react': '^18.0.0' }
      });

      checker.checkPeerDependencies(graph);
      
      expect(checker.issues).toHaveLength(0);
    });
  });

  describe('checkVersionIncompatibilities', () => {
    test('should detect incompatible package versions', () => {
      graph.addNode('react', { version: '18.0.0' });
      graph.addNode('react-dom', { version: '17.0.0' });

      checker.checkVersionIncompatibilities(graph);
      
      const incompatIssues = checker.issues.filter(i => i.type === 'version-incompatibility');
      expect(incompatIssues.length).toBeGreaterThan(0);
      expect(incompatIssues[0].severity).toBe('error');
    });

    test('should not flag compatible versions', () => {
      graph.addNode('react', { version: '18.0.0' });
      graph.addNode('react-dom', { version: '18.0.0' });

      checker.checkVersionIncompatibilities(graph);
      
      const incompatIssues = checker.issues.filter(i => i.type === 'version-incompatibility');
      expect(incompatIssues).toHaveLength(0);
    });
  });

  describe('checkDeprecatedPackages', () => {
    test('should detect deprecated packages', () => {
      graph.addNode('node-sass', { version: '6.0.0' });

      checker.checkDeprecatedPackages(graph);
      
      const deprecatedIssues = checker.issues.filter(i => i.type === 'deprecated-package');
      expect(deprecatedIssues).toHaveLength(1);
      expect(deprecatedIssues[0].package).toBe('node-sass');
      expect(deprecatedIssues[0].replacement).toBe('sass');
    });
  });

  describe('checkESMCompatibility', () => {
    test('should detect ESM-only packages in CommonJS project', () => {
      graph.addNode('chalk', { version: '5.0.0' });

      const projectMetadata = { type: 'commonjs' };
      checker.checkESMCompatibility(graph, projectMetadata);
      
      const esmIssues = checker.issues.filter(i => i.type === 'esm-commonjs-conflict');
      expect(esmIssues).toHaveLength(1);
      expect(esmIssues[0].severity).toBe('error');
    });

    test('should not flag ESM packages in ESM project', () => {
      graph.addNode('chalk', { version: '5.0.0' });

      const projectMetadata = { type: 'module' };
      checker.checkESMCompatibility(graph, projectMetadata);
      
      const esmIssues = checker.issues.filter(i => i.type === 'esm-commonjs-conflict');
      expect(esmIssues).toHaveLength(0);
    });
  });

  describe('checkEngineRequirements', () => {
    test('should detect Node.js version mismatch', () => {
      graph.addNode('typescript', {
        version: '5.0.0',
        engines: { node: '>=18.0.0' }
      });

      const projectMetadata = { engines: {} };
      
      // Mock process.version to simulate older Node
      const originalVersion = process.version;
      Object.defineProperty(process, 'version', { value: 'v16.0.0' });

      checker.checkEngineRequirements(graph, projectMetadata);
      
      const engineIssues = checker.issues.filter(i => i.type === 'engine-mismatch');
      expect(engineIssues.length).toBeGreaterThan(0);

      // Restore
      Object.defineProperty(process, 'version', { value: originalVersion });
    });
  });

  describe('getSummary', () => {
    test('should return correct summary statistics', () => {
      checker.issues = [
        { type: 'peer-dependency-mismatch', severity: 'error' },
        { type: 'deprecated-package', severity: 'warning' },
        { type: 'version-incompatibility', severity: 'error' }
      ];

      const summary = checker.getSummary();
      
      expect(summary.total).toBe(3);
      expect(summary.errors).toBe(2);
      expect(summary.warnings).toBe(1);
      expect(summary.types.peerDependency).toBe(1);
      expect(summary.types.versionIncompatibility).toBe(1);
      expect(summary.types.deprecated).toBe(1);
    });
  });

  describe('getIssuesBySeverity', () => {
    test('should group issues by severity', () => {
      checker.issues = [
        { severity: 'error', message: 'Error 1' },
        { severity: 'warning', message: 'Warning 1' },
        { severity: 'error', message: 'Error 2' }
      ];

      const grouped = checker.getIssuesBySeverity();
      
      expect(grouped.error).toHaveLength(2);
      expect(grouped.warning).toHaveLength(1);
      expect(grouped.info).toHaveLength(0);
    });
  });
});
