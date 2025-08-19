#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

function getExePath() {
    const arch = process.arch;
    const platform = process.platform;
    const binName = 'fuck-u-code';

    if (platform === 'win32' && arch === 'x64') {
        return path.join(__dirname, 'dist', `${binName}-win.exe`);
    }
    if (platform === 'linux' && arch === 'x64') {
        return path.join(__dirname, 'dist', `${binName}-linux`);
    }
    if (platform === 'darwin' && arch === 'x64') {
        return path.join(__dirname, 'dist', `${binName}-darwin`);
    }

    console.error(`Unsupported platform: ${platform} ${arch}`);
    process.exit(1);
}

const exePath = getExePath();
const args = process.argv.slice(2);

const child = spawn(exePath, args, { stdio: 'inherit' });

child.on('close', (code) => {
    process.exit(code);
});