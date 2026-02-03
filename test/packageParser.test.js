const PackageParser = require('../src/parsers/packageParser');
const path = require('node:path');
const fs = require('node:fs').promises;
const os = require('node:os');

describe('PackageParser', () => {
  let parser;
  let testDir;

  beforeEach(async () => {
    parser = new PackageParser();
    // Create temp directory for test files
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'compatify-test-'));
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('parsePackageJson', () => {
    test('should parse valid package.json', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'react': '^18.0.0'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson)
      );

      const result = await parser.parsePackageJson(testDir);
      expect(result.name).toBe('test-project');
      expect(result.version).toBe('1.0.0');
      expect(result.dependencies.react).toBe('^18.0.0');
    });

    test('should throw error for missing package.json', async () => {
      await expect(parser.parsePackageJson(testDir))
        .rejects.toThrow('Failed to parse package.json');
    });

    test('should throw error for invalid JSON', async () => {
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        'invalid json {'
      );

      await expect(parser.parsePackageJson(testDir))
        .rejects.toThrow('Failed to parse package.json');
    });
  });

  describe('parsePackageLock', () => {
    test('should return null for missing package-lock.json', async () => {
      const result = await parser.parsePackageLock(testDir);
      expect(result).toBeNull();
    });

    test('should parse valid package-lock.json (v2 format)', async () => {
      const packageLock = {
        lockfileVersion: 2,
        packages: {
          '': {
            name: 'test-project',
            version: '1.0.0'
          },
          'node_modules/react': {
            version: '18.0.0',
            resolved: 'https://registry.npmjs.org/react/-/react-18.0.0.tgz'
          }
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package-lock.json'),
        JSON.stringify(packageLock)
      );

      const result = await parser.parsePackageLock(testDir);
      expect(result.lockfileVersion).toBe(2);
      expect(result.packages['node_modules/react'].version).toBe('18.0.0');
    });
  });

  describe('extractDependencies', () => {
    test('should extract all dependency types', () => {
      const packageJson = {
        dependencies: { 'pkg-a': '1.0.0' },
        devDependencies: { 'pkg-b': '2.0.0' },
        peerDependencies: { 'pkg-c': '3.0.0' },
        optionalDependencies: { 'pkg-d': '4.0.0' }
      };

      const result = parser.extractDependencies(packageJson);

      expect(result.dependencies['pkg-a']).toBe('1.0.0');
      expect(result.devDependencies['pkg-b']).toBe('2.0.0');
      expect(result.peerDependencies['pkg-c']).toBe('3.0.0');
      expect(result.optionalDependencies['pkg-d']).toBe('4.0.0');
      expect(result.all['pkg-a']).toBe('1.0.0');
      expect(result.all['pkg-b']).toBe('2.0.0');
    });

    test('should handle missing dependency sections', () => {
      const packageJson = {};
      const result = parser.extractDependencies(packageJson);

      expect(result.dependencies).toEqual({});
      expect(result.devDependencies).toEqual({});
      expect(result.all).toEqual({});
    });
  });

  describe('extractInstalledPackages', () => {
    test('should extract packages from lockfile v2 format', () => {
      const packageLock = {
        lockfileVersion: 2,
        packages: {
          '': { name: 'root' },
          'node_modules/react': {
            version: '18.0.0',
            resolved: 'https://registry.npmjs.org/react/-/react-18.0.0.tgz',
            dependencies: { 'loose-envify': '^1.1.0' },
            peerDependencies: {},
            engines: { node: '>=14.0.0' }
          }
        }
      };

      const result = parser.extractInstalledPackages(packageLock);

      expect(result.has('react')).toBe(true);
      expect(result.get('react').version).toBe('18.0.0');
      expect(result.get('react').engines.node).toBe('>=14.0.0');
    });

    test('should handle null lockfile', () => {
      const result = parser.extractInstalledPackages(null);
      expect(result.size).toBe(0);
    });
  });

  describe('extractProjectMetadata', () => {
    test('should extract project metadata', () => {
      const packageJson = {
        name: 'my-project',
        version: '2.0.0',
        engines: { node: '>=16.0.0' },
        type: 'module'
      };

      const result = parser.extractProjectMetadata(packageJson);

      expect(result.name).toBe('my-project');
      expect(result.version).toBe('2.0.0');
      expect(result.engines.node).toBe('>=16.0.0');
      expect(result.type).toBe('module');
    });

    test('should use defaults for missing fields', () => {
      const packageJson = {};
      const result = parser.extractProjectMetadata(packageJson);

      expect(result.name).toBe('unknown');
      expect(result.version).toBe('0.0.0');
      expect(result.type).toBe('commonjs');
    });
  });
});
