/**
 * Update command - updates eff-u-code to the latest version
 */

import { Command } from 'commander';
import { execSync } from 'node:child_process';
import { t } from '../../i18n/index.js';
import chalk from 'chalk';

interface NpmListOutput {
  dependencies?: {
    'eff-u-code'?: {
      version: string;
    };
  };
}

export function createUpdateCommand(): Command {
  const command = new Command('update');

  command
    .description(t('cmd_update_description'))
    .addHelpText(
      'after',
      `
${t('cli_examples')}
  $ fuck-u-code update    # ${t('cmd_update_example')}
`
    )
    .action(() => {
      try {
        console.log(chalk.blue('🔄 ' + t('update_checking')));

        // Get current version
        const currentVersion = execSync('npm list -g eff-u-code --depth=0 --json', {
          encoding: 'utf-8',
        });
        const current = JSON.parse(currentVersion) as NpmListOutput;
        const installedVersion = current.dependencies?.['eff-u-code']?.version ?? 'unknown';

        // Get latest version from npm
        const latestVersionOutput = execSync('npm view eff-u-code version', {
          encoding: 'utf-8',
        }).trim();

        console.log(chalk.gray(`${t('update_current_version')}: ${installedVersion}`));
        console.log(chalk.gray(`${t('update_latest_version')}: ${latestVersionOutput}`));

        if (installedVersion === latestVersionOutput) {
          console.log(chalk.green('✓ ' + t('update_already_latest')));
          return;
        }

        console.log(chalk.yellow('⬆ ' + t('update_updating')));

        // Update the package
        execSync('npm install -g eff-u-code@latest', {
          stdio: 'inherit',
        });

        console.log(chalk.green('✓ ' + t('update_success')));
        console.log(chalk.gray(`${t('update_updated_to')}: ${latestVersionOutput}`));
      } catch (error) {
        console.error(chalk.red('✗ ' + t('update_failed')));
        if (error instanceof Error) {
          console.error(chalk.red(error.message));
        }
        process.exit(1);
      }
    });

  return command;
}
