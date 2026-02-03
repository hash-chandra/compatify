# Contributing to Compatify

Thank you for your interest in contributing to Compatify! This document provides guidelines for contributing to the project.

## Ways to Contribute

1. **Report Bugs** - Found a bug? Open an issue
2. **Suggest Features** - Have an idea? Let us know
3. **Add Compatibility Rules** - Know of a compatibility issue? Add it to our database
4. **Improve Documentation** - Help make our docs better
5. **Submit Code** - Fix bugs or implement features

## Adding Compatibility Rules

The most valuable contribution you can make is adding compatibility rules. Here's how:

### Rule Schema

Edit [data/rules.json](../data/rules.json) and add entries following this schema:

#### Version Incompatibility Rule

```json
{
  "package": "package-name",
  "version": "^major.0.0",
  "incompatibleWith": [
    {
      "package": "other-package",
      "versionRange": "<major.0.0",
      "reason": "Clear explanation of why they're incompatible",
      "severity": "error",
      "fix": "npm install other-package@^major.0.0"
    }
  ],
  "requires": {
    "node": ">=14.0.0"
  }
}
```

#### Deprecated Package Rule

```json
{
  "package": "deprecated-package",
  "reason": "Explanation of why it's deprecated",
  "severity": "warning",
  "replacement": "new-package",
  "fix": "npm install new-package && npm uninstall deprecated-package"
}
```

#### ESM-Only Package Rule

```json
{
  "package": "package-name",
  "version": ">=major.0.0",
  "type": "esm-only",
  "message": "package-name major.x is pure ESM. Use version X.x for CommonJS projects",
  "severity": "error",
  "compatibleVersion": "^prevMajor.0.0"
}
```

### Rule Guidelines

1. **Accuracy**: Ensure the rule is accurate and verifiable
2. **Clarity**: Provide clear, actionable messages
3. **Severity**: 
   - Use `error` for issues that will cause runtime failures
   - Use `warning` for issues that may cause problems
4. **Fix Command**: Always provide a suggested fix when possible
5. **Sources**: Include links to documentation or issues in your PR description

### Example PR for a New Rule

```markdown
## Add React 19 compatibility rule

Adds compatibility rule for React 19 and react-dom.

### Changes
- Added rule for React 19 requiring react-dom 19+
- Tested with React 19.0.0 and react-dom 18.3.0

### References
- React 19 release notes: https://react.dev/blog/2024/...
- Breaking changes: https://react.dev/blog/2024/...
```

## Development Setup

1. **Fork and Clone**

```bash
git clone https://github.com/YOUR_USERNAME/compatify.git
cd compatify
```

2. **Install Dependencies**

```bash
npm install
```

3. **Run Tests**

```bash
npm test
```

4. **Run Locally**

```bash
node bin/compatify.js check
```

## Code Contribution Guidelines

### Code Style

- Use 2 spaces for indentation
- Follow existing code patterns
- Run `npm run lint` before committing
- Add JSDoc comments for public functions

### Testing

- Add tests for new features
- Ensure all tests pass: `npm test`
- Maintain or improve code coverage
- Test edge cases

### Commit Messages

Follow conventional commits:

```
feat: add support for pnpm lockfiles
fix: correct semver range parsing for prereleases
docs: update installation instructions
test: add tests for ESM detection
```

### Pull Request Process

1. **Create a Branch**

```bash
git checkout -b feature/your-feature-name
```

2. **Make Your Changes**
   - Write code
   - Add tests
   - Update documentation

3. **Test Your Changes**

```bash
npm test
npm run lint
```

4. **Commit Your Changes**

```bash
git add .
git commit -m "feat: description of your changes"
```

5. **Push to Your Fork**

```bash
git push origin feature/your-feature-name
```

6. **Create Pull Request**
   - Go to GitHub and create a PR
   - Fill out the PR template
   - Link any related issues

### PR Checklist

- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Code follows style guidelines
- [ ] Commit messages follow convention
- [ ] All CI checks passing

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

## Project Structure

```
compatify/
├── bin/              # CLI entry point
│   └── compatify.js
├── src/              # Source code
│   ├── parsers/      # Package.json and lockfile parsers
│   ├── graph/        # Dependency graph builder
│   ├── checker/      # Compatibility checker
│   └── registry/     # NPM registry client
├── data/             # Compatibility rules database
│   └── rules.json
├── test/             # Test files
└── docs/             # Documentation
```

## Release Process

(For maintainers)

1. Update version in package.json
2. Update CHANGELOG.md
3. Create a git tag
4. Push to GitHub
5. Create GitHub release
6. Publish to npm

```bash
npm version [major|minor|patch]
git push origin main --tags
npm publish
```

## Need Help?

- 💬 [Join Discussions](https://github.com/chanagonda/compatify/discussions)
- 📧 Email: your-email@example.com
- 🐦 Twitter: @yourhandle

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to make better software together.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
