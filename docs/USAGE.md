# Compatify - Quick Start Guide

## Installation

Install compatify globally to use it across all your projects:

```bash
npm install -g compatify
```

Or install locally in your project:

```bash
npm install --save-dev compatify
```

## Basic Usage

### Check Current Project

Navigate to your Node.js project directory and run:

```bash
compatify check
```

This will analyze your `package.json` and `package-lock.json` files and report any compatibility issues.

### Check Another Project

To check a different project, specify the path:

```bash
compatify scan /path/to/project
```

### Verbose Output

Get detailed information about the analysis:

```bash
compatify check --verbose
```

### JSON Output

For CI/CD integration or programmatic usage:

```bash
compatify check --json > compatibility-report.json
```

## Common Scenarios

### 1. Checking Before Upgrading Dependencies

Before running `npm update`, check for potential compatibility issues:

```bash
compatify check --verbose
```

### 2. CI/CD Integration

Add to your `.github/workflows/ci.yml`:

```yaml
- name: Check Dependency Compatibility
  run: npx compatify check --json
```

The tool will exit with code 1 if errors are found, failing your CI build.

### 3. Pre-commit Hook

Add to your `package.json`:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "compatify check"
    }
  }
}
```

### 4. npm Scripts

Add to `package.json` scripts:

```json
{
  "scripts": {
    "check:compat": "compatify check",
    "check:compat:verbose": "compatify check --verbose"
  }
}
```

Then run with:

```bash
npm run check:compat
```

## Understanding the Output

### Severity Levels

- **Error (Red)**: Critical issues that will likely cause runtime failures
  - Missing or incompatible peer dependencies
  - Major version incompatibilities
  - ESM/CommonJS conflicts in CommonJS projects

- **Warning (Yellow)**: Issues that may cause problems
  - Deprecated packages
  - Node.js version approaching end-of-life
  - Minor version incompatibilities

- **Info (Blue)**: Informational notices
  - Suggestions for better alternatives
  - Performance optimizations

### Example Output

```
🔍 Analyzing dependencies in: /Users/dev/my-app

✖ Found 2 errors
⚠ Found 1 warning

┌──────────────────┬─────────┬──────────────────────────────────────────┐
│ Package          │ Severity│ Issue                                    │
├──────────────────┼─────────┼──────────────────────────────────────────┤
│ react / react-dom│ error   │ react@18.2.0 requires react-dom@^18.0.0 │
│                  │         │ but found react-dom@17.0.2               │
├──────────────────┼─────────┼──────────────────────────────────────────┤
│ chalk            │ error   │ chalk 5.x is pure ESM. Use chalk 4.x for │
│                  │         │ CommonJS projects or migrate to ESM      │
├──────────────────┼─────────┼──────────────────────────────────────────┤
│ node-sass        │ warning │ node-sass is deprecated. Use 'sass'      │
└──────────────────┴─────────┴──────────────────────────────────────────┘

💡 Suggested fixes:
  • npm install react-dom@^18.0.0
  • npm install chalk@^4.1.2
  • npm install sass && npm uninstall node-sass
```

## Configuration

Create a `.compatifyrc.json` in your project root to customize behavior:

```json
{
  "ignore": ["some-optional-package"],
  "severity": {
    "deprecated": "warning",
    "peerDependency": "error",
    "engineMismatch": "warning"
  },
  "cache": true,
  "cacheTTL": 86400
}
```

### Configuration Options

- **ignore**: Array of package names to exclude from checking
- **severity**: Customize severity levels for different issue types
- **cache**: Enable/disable caching of npm registry data
- **cacheTTL**: Cache time-to-live in seconds (default: 86400 = 24 hours)

## Programmatic Usage

Use compatify in your Node.js scripts:

```javascript
const { checkCompatibility } = require('compatify');

async function checkMyProject() {
  const result = await checkCompatibility('/path/to/project');
  
  console.log(`Found ${result.summary.total} issues`);
  console.log(`Errors: ${result.summary.errors}`);
  console.log(`Warnings: ${result.summary.warnings}`);
  
  for (const issue of result.issues) {
    console.log(`${issue.severity}: ${issue.message}`);
  }
}

checkMyProject();
```

## Tips & Best Practices

1. **Run Before Major Updates**: Always run compatify before upgrading major dependencies

2. **Check After Fresh Install**: Run after `npm install` to catch issues early

3. **Use in CI/CD**: Integrate into your continuous integration pipeline

4. **Keep Rules Updated**: Update compatify regularly to get the latest compatibility rules

5. **Review Warnings**: Don't ignore warnings - they often indicate future problems

6. **Check Peer Dependencies**: Pay special attention to peer dependency conflicts

## Troubleshooting

### "No package-lock.json found"

Run `npm install` first to generate the lockfile.

### False Positives

If you encounter a false positive, you can:
1. Add the package to the `ignore` list in `.compatifyrc.json`
2. Report it as an issue on GitHub

### Cache Issues

Clear the cache if you're seeing stale data:

```bash
rm -rf ~/.compatify-cache
```

## Getting Help

- 📖 [Full Documentation](https://github.com/chanagonda/compatify)
- 🐛 [Report Issues](https://github.com/chanagonda/compatify/issues)
- 💬 [Discussions](https://github.com/chanagonda/compatify/discussions)

## Contributing

Found a compatibility issue that compatify doesn't catch? Contribute to the rules database!

See [data/rules.json](../data/rules.json) for the schema.
