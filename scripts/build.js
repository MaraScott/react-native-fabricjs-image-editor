#!/usr/bin/env node

const fs = require('fs');
const esbuild = require('esbuild');
const {
  outDir,
  manifestFile,
  ensureEntryFile,
  ensureOutDir,
  updateIndexHtml,
  createBuildOptions,
} = require('./buildShared');

const modeArg = process.argv.find((arg) => arg.startsWith('--mode='));
const mode = modeArg ? modeArg.split('=')[1] : 'production';

async function buildBundle() {
  ensureEntryFile();
  fs.rmSync(outDir, { recursive: true, force: true });
  ensureOutDir();

  const options = createBuildOptions({ mode });
  await esbuild.build(options);

  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  updateIndexHtml(manifest);
  const outputs = [manifest.js, manifest.css].filter(Boolean).join(', ');
  console.log(`Build completed. Emitted ${outputs}`);
}

buildBundle().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
