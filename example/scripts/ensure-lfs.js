#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const FILE = path.join(PACKAGE_ROOT, 'models', 'tts', 'model_ex2_rich_kate.dm');
const MIN_REAL_SIZE = 50 * 1024 * 1024;

function isLFSPointer(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(256);
  const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);
  fs.closeSync(fd);
  return buffer.slice(0, bytesRead).toString('utf8').includes('git-lfs.github.com/spec/v1');
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: PACKAGE_ROOT,
    stdio: 'inherit',
    ...options,
  });
}

function fail(message) {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

try {
  if (!fs.existsSync(FILE)) fail(`Missing required model file: ${path.relative(PACKAGE_ROOT, FILE)}`);

  if (fs.statSync(FILE).size >= MIN_REAL_SIZE) process.exit(0);
  if (!isLFSPointer(FILE)) {
    fail(`Model file is too small and is not a Git LFS pointer: ${path.relative(PACKAGE_ROOT, FILE)}`);
  }

  try {
    execFileSync('git', ['lfs', 'version'], { stdio: 'ignore' });
  } catch {
    fail(
      'Git LFS is not installed or is not on PATH. Install it, then run:\n' +
      '  git lfs install\n' +
      '  git lfs pull'
    );
  }

  console.error(`⚠️ Git LFS pointer detected for ${path.relative(PACKAGE_ROOT, FILE)}.`);
  run('git', ['lfs', 'install']);

  const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: PACKAGE_ROOT,
    encoding: 'utf8',
  }).trim();
  const includePath = path.relative(repoRoot, FILE).split(path.sep).join('/');
  run('git', ['lfs', 'pull', `--include=${includePath}`]);

  if (fs.statSync(FILE).size < MIN_REAL_SIZE) {
    fail('Git LFS pull completed, but the real model is still unavailable. Try: git lfs pull');
  }

  console.error(`✅ Git LFS model ready (${Math.round(fs.statSync(FILE).size / 1024 / 1024)} MB).`);
} catch (error) {
  fail(`ensure-lfs failed: ${error?.message || error}`);
}
