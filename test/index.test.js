const { checkCompatibility, PackageParser, DependencyGraph, CompatibilityChecker, NpmRegistry } = require('../src/index');
const path = require('node:path');
const fs = require('node:fs').promises;
const os = require('node:os');

describe('Index Module', () => {
  describe('checkCompatibility', () => {
    let tempDir;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'compatify-test-'));
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should check compatibility for a valid project', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0'
        }
      };

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await checkCompatibility(tempDir);

      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata.name).toBe('test-project');
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should detect compatibility issues', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^17.0.0',
          'react-dom': '^16.14.0' // Incompatible version
        }
      };

      const packageLock = {
        name: 'test-project',
        version: '1.0.0',
        lockfileVersion: 2,
        requires: true,
        packages: {
          '': {
            name: 'test-project',
            version: '1.0.0',
            dependencies: {
              react: '^17.0.0',
              'react-dom': '^16.14.0'
            }
          },
          'node_modules/react': {
            version: '17.0.2',
            resolved: 'https://registry.npmjs.org/react/-/react-17.0.2.tgz'
          },
          'node_modules/react-dom': {
            version: '16.14.0',
            resolved: 'https://registry.npmjs.org/react-dom/-/react-dom-16.14.0.tgz',
            dependencies: {
              react: '^16.14.0'
            }
          }
        },
        dependencies: {
          react: {
            version: '17.0.2',
            resolved: 'https://registry.npmjs.org/react/-/react-17.0.2.tgz'
          },
          'react-dom': {
            version: '16.14.0',
            resolved: 'https://registry.npmjs.org/react-dom/-/react-dom-16.14.0.tgz',
            requires: {
              react: '^16.14.0'
            }
          }
        }
      };

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      await fs.writeFile(
        path.join(tempDir, 'package-lock.json'),
        JSON.stringify(packageLock, null, 2)
      );

      const result = await checkCompatibility(tempDir);

      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.summary.errors).toBeGreaterThan(0);
    });

    it('should use custom rules path when provided', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {}
      };

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const customRulesPath = path.join(__dirname, '../data/rules.json');
      const result = await checkCompatibility(tempDir, { rulesPath: customRulesPath });

      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('summary');
    });

    it('should handle projects without dependencies', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0'
      };

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await checkCompatibility(tempDir);

      expect(result.issues.length).toBe(0);
      expect(result.summary.total).toBe(0);
    });

    it('should throw error for missing package.json', async () => {
      await expect(checkCompatibility(tempDir)).rejects.toThrow();
    });
  });

  describe('Exported Classes', () => {
    it('should export PackageParser', () => {
      expect(PackageParser).toBeDefined();
      expect(typeof PackageParser).toBe('function');
    });

    it('should export DependencyGraph', () => {
      expect(DependencyGraph).toBeDefined();
      expect(typeof DependencyGraph).toBe('function');
    });

    it('should export CompatibilityChecker', () => {
      expect(CompatibilityChecker).toBeDefined();
      expect(typeof CompatibilityChecker).toBe('function');
    });

    it('should export NpmRegistry', () => {
      expect(NpmRegistry).toBeDefined();
      expect(typeof NpmRegistry).toBe('function');
    });
  });
});
