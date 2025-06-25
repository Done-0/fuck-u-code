/**
 * Main entry point
 */

import { runCLI } from './cli/index.js';
import { t } from './i18n/index.js';

runCLI().catch((error: unknown) => {
  console.error(
    t('error_fatal', { error: error instanceof Error ? error.message : String(error) })
  );
  process.exit(1);
});
