#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const Table = require('cli-table3');

const { checkCompatibility, pluginManager } = require('../src/index');

const program = new Command();

program
  .name('compatify')
  .description('Detect dependency compatibility issues across multiple languages')
  .version('1.0.2');

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
 * Main check function with plugin support
 */
async function checkProject(projectPath, options) {
  const spinner = ora('Detecting project type...').start();

  try {
    // Auto-detect or use specified language
    const detectedPlugin = await pluginManager.getBestPlugin(projectPath, options.language);
    
    if (!detectedPlugin) {
      spinner.fail(chalk.red('Could not detect project type'));
      console.log(chalk.yellow('\nSupported languages:'));
      pluginManager.getSupportedLanguages().forEach(lang => {
        console.log(chalk.cyan(`  • ${lang}`));
      });
      console.log(chalk.dim('\nUse --language flag to specify explicitly\n'));
      process.exit(1);
    }

    const languageName = detectedPlugin.language;
    spinner.text = `Analyzing ${languageName} project dependencies...`;

    // Run compatibility check using plugin
    const results = await checkCompatibility(projectPath, {
      language: options.language,
      rulesPath: options.rulesPath
    });

    const { issues, summary, metadata, plugin } = results;

    spinner.stop();

    // Display results
    if (options.json) {
      console.log(JSON.stringify({
        projectPath,
        projectName: metadata.name,
        language: plugin.language,
        nodeVersion: process.version,
        issues,
        summary
      }, null, 2));
    } else {
      console.log(chalk.bold(`\n🔍 Analyzing ${chalk.cyan(plugin.language)} project: ${projectPath}\n`));
      
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
    if (summary.errors > 0) {
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
  .option('-l, --language <lang>', 'Specify language explicitly (nodejs, python, etc.)')
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
  .option('-l, --language <lang>', 'Specify language explicitly (nodejs, python, etc.)')
  .option('-v, --verbose', 'Show detailed output')
  .option('-j, --json', 'Output results as JSON')
  .action(async (projectPath, options) => {
    const absolutePath = path.resolve(projectPath);
    await checkProject(absolutePath, options);
  });

// Languages command - show supported languages
program
  .command('languages')
  .description('List all supported programming languages')
  .action(() => {
    console.log(chalk.bold('\n🌐 Supported Languages:\n'));
    const plugins = pluginManager.getPluginsInfo();
    plugins.forEach(plugin => {
      console.log(chalk.cyan(`  • ${plugin.language}`));
      console.log(chalk.dim(`    ${plugin.description || plugin.name}`));
      console.log(chalk.dim(`    Manifest files: ${plugin.manifestFiles.join(', ')}\n`));
    });
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
