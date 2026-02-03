const https = require('node:https');
const fs = require('node:fs').promises;
const path = require('node:path');
const os = require('node:os');

/**
 * Fetch files from GitHub repository
 */
class GitHubFetcher {
  /**
   * Parse GitHub URL to extract owner, repo, and branch
   * @param {string} url - GitHub repository URL
   * @returns {Object} Parsed repository information
   */
  static parseGitHubUrl(url) {
    // Support various GitHub URL formats
    const patterns = [
      /github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?/,
      /github\.com\/([^/]+)\/([^/]+)\.git/
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(url);
      if (match) {
        const owner = match[1];
        const repo = match[2].replace(/\.git$/, '');
        const branch = match[3] || 'main';
        return { owner, repo, branch };
      }
    }

    throw new Error('Invalid GitHub URL format. Expected: https://github.com/owner/repo');
  }

  /**
   * Fetch raw file content from GitHub
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} branch - Branch name
   * @param {string} filePath - File path in repository
   * @returns {Promise<string>} File content
   */
  static fetchRawFile(owner, repo, branch, filePath) {
    return new Promise((resolve, reject) => {
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;

      https.get(url, (res) => {
        if (res.statusCode === 404) {
          resolve(null); // File doesn't exist
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch ${filePath}: HTTP ${res.statusCode}`));
          return;
        }

        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve(data);
        });
      }).on('error', reject);
    });
  }

  /**
   * Download repository files to a temporary directory
   * @param {string} githubUrl - GitHub repository URL
   * @returns {Promise<string>} Path to temporary directory
   */
  static async downloadRepository(githubUrl) {
    const { owner, repo, branch } = this.parseGitHubUrl(githubUrl);

    // Create temporary directory
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'compatify-remote-'));

    try {
      // Fetch package.json
      const packageJsonContent = await this.fetchRawFile(owner, repo, branch, 'package.json');
      if (!packageJsonContent) {
        throw new Error('package.json not found in repository');
      }
      await fs.writeFile(path.join(tempDir, 'package.json'), packageJsonContent);

      // Try to fetch package-lock.json
      const packageLockContent = await this.fetchRawFile(owner, repo, branch, 'package-lock.json');
      if (packageLockContent) {
        await fs.writeFile(path.join(tempDir, 'package-lock.json'), packageLockContent);
      }

      return tempDir;
    } catch (error) {
      // Cleanup on error
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
  }

  /**
   * Cleanup temporary directory
   * @param {string} tempDir - Path to temporary directory
   */
  static async cleanup(tempDir) {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

module.exports = GitHubFetcher;
