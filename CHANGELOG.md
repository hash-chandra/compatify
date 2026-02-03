# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-02

### Added
- Initial release of Compatify
- Dependency parser for package.json and package-lock.json (npm v1, v2, v3 formats)
- Dependency graph builder with transitive dependency support
- Compatibility checker with multiple rule types:
  - Peer dependency conflict detection
  - Version incompatibility detection
  - Deprecated package warnings
  - ESM/CommonJS conflict detection
  - Node.js engine requirement validation
- CLI interface with Commander.js
  - `compatify check` command for current directory
  - `compatify scan <path>` command for specific projects
  - `--json` flag for machine-readable output
  - `--verbose` flag for detailed analysis
- Comprehensive compatibility rules database covering:
  - React ecosystem (React, React-DOM, React Router)
  - Build tools (Webpack, Babel, ESLint)
  - Testing frameworks (Jest, ts-jest)
  - Vue.js ecosystem
  - Angular framework
  - Next.js framework
  - Popular deprecated packages
  - ESM-only packages
- npm registry integration with pacote
- Local caching system for npm registry data
- Colored terminal output with chalk
- Progress indicators with ora
- Table-formatted output with cli-table3
- Configuration file support (.compatifyrc.json)
- Comprehensive test suite with Jest (32 tests)
- Documentation:
  - README with features and examples
  - USAGE guide with common scenarios
  - CONTRIBUTING guide for community contributions
- Example projects demonstrating compatibility issues
- MIT License

### Features
- Automatic semver version range matching
- Transitive dependency analysis
- Node.js end-of-life detection
- Actionable fix suggestions for each issue
- CI/CD integration support with exit codes
- Programmatic API for Node.js scripts
- Cross-platform support (Windows, macOS, Linux)

### Technical Details
- Built with Node.js 14+
- Modular architecture with separate concerns:
  - Parsers (package.json, package-lock.json)
  - Graph builder (dependency relationships)
  - Checker (rule evaluation)
  - Registry client (npm metadata fetching)
- Efficient caching to minimize network requests
- Comprehensive error handling
- Extensive JSDoc documentation

## [Unreleased]

### Planned Features
- Support for yarn.lock and pnpm-lock.yaml
- Auto-fix mode to update package.json automatically
- Web UI for browsing compatibility rules
- Plugin system for custom rules
- GitHub Action for automated checks
- VS Code extension for inline warnings
- Additional language support (Python, Maven, Gradle)
- Performance optimization for large monorepos
- Community-contributed rules repository
- Integration with Dependabot and Renovate
- Historical compatibility data and trends
- License compatibility checking
- Bundle size impact analysis

[1.0.0]: https://github.com/hash-chandra/compatify/releases/tag/v1.0.0
