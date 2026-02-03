#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const Table = require('cli-table3');

const PackageParser = require('../src/parsers/packageParser');
const DependencyGraph = require('../src/graph/dependencyGraph');
const CompatibilityChecker = require('../src/checker/compatibilityChecker');

const program = new Command();

program
  .name('compatify')
  .description('Detect dependency compatibility issues in Node.js projects')
  .version('1.0.0');

/**
 * Format and display issues in a table
 */
function displayIssuesTable(issues) {
  if (issues.length === 0) {
    console.log(chalk.green('\n✓ No compatibility issues found!\n'));
    return;
  }

  const table = new Table({
    head: [
      chalk.bold('Package'),
      chalk.bold('Severity'),
      chalk.bold('Issue')
    ],
    colWidths: [25, 10, 65],
    wordWrap: true,
    style: {
      head: ['cyan']
    }
  });

  for (const issue of issues) {
    const packageInfo = issue.package + (issue.version ? `@${issue.version}` : '');
    const severity = issue.severity === 'error' 
      ? chalk.red(issue.severity)
      : issue.severity === 'warning'
      ? chalk.yellow(issue.severity)
      : chalk.blue(issue.severity);

    table.push([packageInfo, severity, issue.message]);
  }

  console.log(table.toString());
}

/**
 * Display suggested fixes
 */
function displayFixes(issues) {
  const fixableIssues = issues.filter(i => i.fix);
  
  if (fixableIssues.length === 0) return;

  console.log(chalk.bold('\n💡 Suggested fixes:\n'));
  
  const uniqueFixes = [...new Set(fixableIssues.map(i => i.fix))];
  uniqueFixes.forEach(fix => {
    console.log(chalk.cyan('  • ') + fix);
  });
  console.log();
}

/**
 * Display summary statistics
 */
function displaySummary(summary, projectPath) {
  console.log(chalk.bold(`\n📊 Summary for ${projectPath}:\n`));
  console.log(`  Total issues: ${summary.total}`);
  console.log(`  ${chalk.red('Errors')}: ${summary.errors}`);
  console.log(`  ${chalk.yellow('Warnings')}: ${summary.warnings}`);
  
  if (summary.info > 0) {
    console.log(`  ${chalk.blue('Info')}: ${summary.info}`);
  }

  console.log(chalk.bold('\n  Issue breakdown:'));
  console.log(`  • Peer dependencies: ${summary.types.peerDependency}`);
  console.log(`  • Version incompatibilities: ${summary.types.versionIncompatibility}`);
  console.log(`  • Deprecated packages: ${summary.types.deprecated}`);
  console.log(`  • ESM/CommonJS conflicts: ${summary.types.esm}`);
  console.log(`  • Engine mismatches: ${summary.types.engine}`);
  console.log();
}

/**
 * Main check function
 */
async function checkProject(projectPath, options) {
  const spinner = ora('Analyzing project dependencies...').start();

  try {
    // Parse project
    spinner.text = 'Parsing package.json and package-lock.json...';
    const parser = new PackageParser();
    const projectData = await parser.parseProject(projectPath);

    if (!projectData.hasLockFile) {
      spinner.warn(chalk.yellow('No package-lock.json found. Install dependencies first with npm install.'));
      return;
    }

    // Build dependency graph
    spinner.text = 'Building dependency graph...';
    const graph = DependencyGraph.buildFromProject(projectData);

    if (options.verbose) {
      const stats = graph.getStats();
      spinner.info(`Found ${stats.totalPackages} packages (${stats.directDependencies} direct, ${stats.transitiveDependencies} transitive)`);
      spinner.start();
    }

    // Check compatibility
    spinner.text = 'Checking compatibility rules...';
    const checker = new CompatibilityChecker();
    const issues = await checker.check(graph, projectData.metadata);

    spinner.stop();

    // Display results
    if (options.json) {
      console.log(JSON.stringify({
        projectPath,
        projectName: projectData.metadata.name,
        nodeVersion: process.version,
        issues,
        summary: checker.getSummary()
      }, null, 2));
    } else {
      console.log(chalk.bold(`\n🔍 Analyzing dependencies in: ${projectPath}\n`));
      
      const summary = checker.getSummary();
      
      if (issues.length > 0) {
        const errorCount = summary.errors;
        const warningCount = summary.warnings;
        
        if (errorCount > 0) {
          console.log(chalk.red(`✖ Found ${errorCount} error${errorCount !== 1 ? 's' : ''}`));
        }
        if (warningCount > 0) {
          console.log(chalk.yellow(`⚠ Found ${warningCount} warning${warningCount !== 1 ? 's' : ''}`));
        }
        console.log();

        displayIssuesTable(issues);
        displayFixes(issues);
      } else {
        console.log(chalk.green('✓ No compatibility issues found!'));
      }

      if (options.verbose) {
        displaySummary(summary, projectPath);
      }
    }

    // Exit with error code if there are errors
    if (checker.getSummary().errors > 0) {
      process.exit(1);
    }

  } catch (error) {
    spinner.fail(chalk.red(`Error: ${error.message}`));
    
    if (options.verbose) {
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Check command
program
  .command('check')
  .description('Check compatibility issues in the current directory')
  .option('-v, --verbose', 'Show detailed output')
  .option('-j, --json', 'Output results as JSON')
  .action(async (options) => {
    const projectPath = process.cwd();
    await checkProject(projectPath, options);
  });

// Scan command
program
  .command('scan <path>')
  .description('Check compatibility issues in a specific project')
  .option('-v, --verbose', 'Show detailed output')
  .option('-j, --json', 'Output results as JSON')
  .action(async (projectPath, options) => {
    const absolutePath = path.resolve(projectPath);
    await checkProject(absolutePath, options);
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
