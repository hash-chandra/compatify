# Compatify - Quick Reference

## Installation

```bash
npm install -g compatify
```

## Basic Commands

| Command | Description |
|---------|-------------|
| `compatify check` | Check current directory |
| `compatify scan <path>` | Check specific project |
| `compatify check --verbose` | Detailed output with stats |
| `compatify check --json` | JSON output for CI/CD |
| `compatify --help` | Show help |
| `compatify --version` | Show version |

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | No errors found |
| `1` | Errors found or command failed |

## Issue Types

| Type | Description | Severity |
|------|-------------|----------|
| `missing-peer-dependency` | Required peer dependency not installed | Error |
| `peer-dependency-mismatch` | Peer dependency version incompatible | Error |
| `version-incompatibility` | Known incompatible package versions | Error |
| `esm-commonjs-conflict` | ESM-only package in CommonJS project | Error |
| `engine-mismatch` | Node.js version incompatible | Error/Warning |
| `deprecated-package` | Package is deprecated | Warning |
| `node-version-eol` | Node.js version end-of-life | Warning |

## Configuration (.compatifyrc.json)

```json
{
  "ignore": ["package-name"],
  "severity": {
    "deprecated": "warning",
    "peerDependency": "error"
  },
  "cache": true,
  "cacheTTL": 86400
}
```

## Programmatic API

```javascript
const { checkCompatibility } = require('compatify');

const result = await checkCompatibility('/path/to/project');
console.log(result.summary);
```

## Common Use Cases

### Pre-commit Hook
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "compatify check"
    }
  }
}
```

### GitHub Actions
```yaml
- name: Check Dependencies
  run: npx compatify check --json
```

### npm Script
```json
{
  "scripts": {
    "check": "compatify check"
  }
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "No package-lock.json found" | Run `npm install` first |
| Stale cache | Delete `~/.compatify-cache` |
| False positive | Add to `ignore` in config |

## Getting Help

- 📖 [Documentation](https://github.com/chanagonda/compatify)
- 🐛 [Report Bug](https://github.com/chanagonda/compatify/issues)
- 💬 [Discussions](https://github.com/chanagonda/compatify/discussions)
