#!/usr/bin/env node

const fs = require('fs');
const esbuild = require('esbuild');
const {
  outDir,
  outFile,
  ensureEntryFile,
  ensureOutDir,
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

  console.log(`Build completed. Wrote ${outFile}`);
}

buildBundle().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
