# Example Projects

This directory contains example projects that demonstrate various compatibility issues that Compatify can detect.

## Examples

### 1. react-version-mismatch
Demonstrates React and React-DOM version incompatibility

### 2. esm-commonjs-conflict
Shows ESM-only package in CommonJS project

### 3. deprecated-packages
Project using deprecated npm packages

### 4. peer-dependency-issues
Missing and mismatched peer dependencies

## Running Examples

```bash
# Check an example project
compatify scan examples/react-version-mismatch

# Or navigate to the example
cd examples/react-version-mismatch
compatify check
```
