# Compatify 🔍

> A Node.js CLI tool to detect dependency compatibility issues in your Node.js projects

[![npm version](https://img.shields.io/npm/v/compatify.svg)](https://www.npmjs.com/package/compatify)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/tests-56%20passing-brightgreen.svg)](https://github.com/yourusername/compatify/actions)
[![Coverage](https://img.shields.io/badge/coverage-81%25-brightgreen.svg)](./CODE_QUALITY_REPORT.md)
[![Security](https://img.shields.io/badge/vulnerabilities-0-brightgreen.svg)](https://github.com/yourusername/compatify/security)
[![Production Ready](https://img.shields.io/badge/production-ready-brightgreen.svg)](./CODE_QUALITY_REPORT.md)

## 🚀 Features

- **Peer Dependency Conflict Detection** - Identifies mismatches between peer dependencies across your dependency tree
- **Node.js Engine Compatibility** - Validates that all dependencies are compatible with your Node.js version
- **Known Incompatibility Detection** - Checks against a curated database of known incompatible package combinations
- **ESM/CommonJS Conflict Detection** - Identifies potential issues with mixed module systems
- **Deprecated Package Warnings** - Alerts you to deprecated packages in your dependency tree
- **Clear, Actionable Reports** - Provides detailed reports with severity levels and suggested fixes
- **Multiple Output Formats** - Supports human-readable table output and JSON for CI/CD integration

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g compatify
```

### Local Installation

```bash
npm install --save-dev compatify
```

## 🛠️ Usage

### Check Current Directory

```bash
compatify check
```

### Check Specific Project

```bash
compatify scan /path/to/project
```

### Check Remote GitHub Repository (New!)

```bash
compatify remote https://github.com/owner/repo
```

Supports various GitHub URL formats:
- `https://github.com/owner/repo`
- `https://github.com/owner/repo/tree/branch-name`
- `https://github.com/owner/repo.git`

### Output as JSON

```bash
compatify check --json
```

### Verbose Output

```bash
compatify check --verbose
```

## 📊 Example Output

```
🔍 Analyzing dependencies in: /Users/dev/my-project

✖ Found 3 compatibility issues:

┌──────────────────┬─────────┬──────────────────────────────────────────┐
│ Package          │ Severity│ Issue                                    │
├──────────────────┼─────────┼──────────────────────────────────────────┤
│ react / react-dom│ error   │ react@18.2.0 requires react-dom@^18.0.0 │
│                  │         │ but found react-dom@17.0.2               │
├──────────────────┼─────────┼──────────────────────────────────────────┤
│ typescript       │ warning │ Node.js 14.x is deprecated, upgrade to   │
│                  │         │ Node.js 18+ for TypeScript 5.0+          │
├──────────────────┼─────────┼──────────────────────────────────────────┤
│ node-sass        │ warning │ node-sass is deprecated, use 'sass'      │
└──────────────────┴─────────┴──────────────────────────────────────────┘

💡 Suggested fixes:
  • npm install react-dom@^18.0.0
  • npm install sass && npm uninstall node-sass
```

## 🔧 Configuration

Create a `.compatifyrc.json` file in your project root:

```json
{
  "ignore": ["some-package"],
  "severity": {
    "deprecated": "warning",
    "peerDependency": "error"
  },
  "cache": true,
  "cacheTTL": 86400
}
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Report Bugs** - Open an issue if you find a bug
2. **Suggest Features** - Have an idea? Let us know!
3. **Submit Compatibility Rules** - Know of a compatibility issue? Add it to our rules database
4. **Improve Documentation** - Help make our docs better

### Adding Compatibility Rules

To contribute a new compatibility rule, add it to `data/rules.json`:

```json
{
  "package": "react",
  "version": "^18.0.0",
  "incompatibleWith": [
    {
      "package": "react-dom",
      "versionRange": "<18.0.0",
      "reason": "React 18 requires react-dom 18+",
      "severity": "error"
    }
  ]
}
```

## 📝 License

MIT © hash-chandra

## 🙏 Acknowledgments

Built with:
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [semver](https://github.com/npm/node-semver) - Semantic versioning
- [pacote](https://github.com/npm/pacote) - npm package fetcher
- [chalk](https://github.com/chalk/chalk) - Terminal styling

## 📮 Support

- 🐛 [Report a bug](https://github.com/hash-chandra/compatify/issues)
- 💬 [Ask a question](https://github.com/hash-chandra/compatify/discussions)
- ⭐ Star this project on GitHub!
