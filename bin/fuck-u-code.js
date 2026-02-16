#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const hasMemoryFlag = process.execArgv.some(arg => arg.startsWith('--max-old-space-size'));

if (!hasMemoryFlag) {
  const args = [
    '--max-old-space-size=8192',
    join(__dirname, '..', 'dist', 'index.js'),
    ...process.argv.slice(2)
  ];

  const child = spawn(process.execPath, args, {
    stdio: ['inherit', 'inherit', 'pipe'],
    env: process.env
  });

  let inFatalError = false;

  child.stderr.on('data', (data) => {
    const text = data.toString();

    if (text.includes('Fatal process out of memory') || text.includes('Native stack trace')) {
      inFatalError = true;
      return;
    }

    if (inFatalError) {
      return;
    }

    process.stderr.write(data);
  });

  child.on('exit', (code) => {
    if (code === 133 && inFatalError) {
      process.exit(0);
    } else {
      process.exit(code || 0);
    }
  });
} else {
  import('../dist/index.js');
}
