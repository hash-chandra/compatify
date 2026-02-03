#!/bin/bash

# Compatify Setup Verification Script
# This script verifies that Compatify is properly installed and configured

echo "🔍 Compatify Setup Verification"
echo "================================"
echo ""

# Check Node.js version
echo "✓ Checking Node.js version..."
node_version=$(node -v)
echo "  Node.js: $node_version"

# Check npm version
echo "✓ Checking npm version..."
npm_version=$(npm -v)
echo "  npm: $npm_version"
echo ""

# Check if dependencies are installed
echo "✓ Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "  ✓ node_modules directory exists"
    dep_count=$(find node_modules -maxdepth 1 -type d | wc -l)
    echo "  ✓ $dep_count packages installed"
else
    echo "  ✗ node_modules not found. Run: npm install"
    exit 1
fi
echo ""

# Run tests
echo "✓ Running tests..."
npm test --silent > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "  ✓ All tests passed"
else
    echo "  ✗ Tests failed. Run: npm test"
    exit 1
fi
echo ""

# Check CLI is executable
echo "✓ Checking CLI..."
if [ -x "bin/compatify.js" ]; then
    echo "  ✓ CLI is executable"
else
    echo "  ⚠ Making CLI executable..."
    chmod +x bin/compatify.js
    echo "  ✓ CLI is now executable"
fi
echo ""

# Test CLI command
echo "✓ Testing CLI..."
node bin/compatify.js --version > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "  ✓ CLI command works"
else
    echo "  ✗ CLI command failed"
    exit 1
fi
echo ""

# Check required files
echo "✓ Checking required files..."
required_files=(
    "package.json"
    "README.md"
    "LICENSE"
    "bin/compatify.js"
    "src/index.js"
    "data/rules.json"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file missing"
        exit 1
    fi
done
echo ""

# Summary
echo "================================"
echo "✅ Compatify is properly set up!"
echo ""
echo "Next steps:"
echo "  • Try: node bin/compatify.js check"
echo "  • Read: docs/USAGE.md"
echo "  • Install globally: npm install -g ."
echo ""
