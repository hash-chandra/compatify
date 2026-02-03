const NpmRegistry = require('../src/registry/npmRegistry');
const path = require('node:path');
const fs = require('node:fs').promises;
const os = require('node:os');

describe('NpmRegistry', () => {
  let registry;
  let tempCacheDir;

  beforeEach(async () => {
    tempCacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'npm-cache-'));
    registry = new NpmRegistry({ cacheDir: tempCacheDir });
  });

  afterEach(async () => {
    await fs.rm(tempCacheDir, { recursive: true, force: true });
  });

  describe('constructor', () => {
    it('should create instance with default cache directory', () => {
      const reg = new NpmRegistry();
      expect(reg).toBeDefined();
      expect(reg.cacheDir).toContain('.compatify-cache');
    });

    it('should create instance with custom cache directory', () => {
      const customDir = '/tmp/custom-cache';
      const reg = new NpmRegistry({ cacheDir: customDir });
      expect(reg.cacheDir).toBe(customDir);
    });
  });

  describe('fetchPackageManifest', () => {
    it('should fetch package manifest from registry', async () => {
      const info = await registry.fetchPackageManifest('react', '18.0.0');

      expect(info).toBeDefined();
      expect(info.name).toBe('react');
    }, 10000);

    it('should cache package info', async () => {
      const info1 = await registry.fetchPackageManifest('lodash', '4.17.21');
      const info2 = await registry.fetchPackageManifest('lodash', '4.17.21');

      expect(info1).toEqual(info2);
    }, 10000);

    it('should handle version latest', async () => {
      const info = await registry.fetchPackageManifest('express');

      expect(info).toBeDefined();
      expect(info.name).toBe('express');
    }, 10000);

    it('should throw error for non-existent package', async () => {
      await expect(
        registry.fetchPackageManifest('this-package-definitely-does-not-exist-12345')
      ).rejects.toThrow();
    }, 10000);
  });

  describe('cache management', () => {
    it('should clear cache for specific package', async () => {
      await registry.fetchPackageManifest('react', '18.0.0');
      await registry.clearCache('react');

      const files = await fs.readdir(tempCacheDir);
      const reactFiles = files.filter(f => f.startsWith('react-'));
      expect(reactFiles.length).toBe(0);
    }, 10000);

    it('should clear entire cache', async () => {
      await registry.fetchPackageManifest('react', '18.0.0');
      await registry.fetchPackageManifest('vue', '3.0.0');
      await registry.clearCache();

      const files = await fs.readdir(tempCacheDir);
      expect(files.length).toBe(0);
    }, 10000);
  });

  describe('_getCachePath', () => {
    it('should generate correct cache path', () => {
      const cachePath = registry._getCachePath('react', '18.0.0');
      expect(cachePath).toContain('react-18.0.0.json');
    });

    it('should handle scoped packages', () => {
      const cachePath = registry._getCachePath('@types/node', '20.0.0');
      expect(cachePath).toContain('@types-node-20.0.0.json');
    });
  });

  describe('_isCacheValid', () => {
    it('should return false for non-existent cache', async () => {
      const isValid = await registry._isCacheValid('non-existent.json');
      expect(isValid).toBe(false);
    });

    it('should return true for recent cache', async () => {
      const testFile = path.join(tempCacheDir, 'test.json');
      await fs.writeFile(testFile, JSON.stringify({ test: true }));

      const isValid = await registry._isCacheValid(testFile);
      expect(isValid).toBe(true);
    });
  });

  describe('_readCache', () => {
    it('should read cache file', async () => {
      const testFile = path.join(tempCacheDir, 'test.json');
      const testData = { name: 'test', version: '1.0.0' };
      await fs.writeFile(testFile, JSON.stringify(testData));

      const data = await registry._readCache(testFile);
      expect(data).toEqual(testData);
    });

    it('should return null for non-existent file', async () => {
      const data = await registry._readCache('non-existent.json');
      expect(data).toBeNull();
    });
  });

  describe('_writeCache', () => {
    it('should write data to cache', async () => {
      const testFile = path.join(tempCacheDir, 'test.json');
      const testData = { name: 'test', version: '1.0.0' };

      await registry._writeCache(testFile, testData);

      const content = await fs.readFile(testFile, 'utf8');
      expect(JSON.parse(content)).toEqual(testData);
    });
  });
});
