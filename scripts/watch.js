#!/usr/bin/env node

const fs = require('fs');
const esbuild = require('esbuild');
const { outDir, ensureEntryFile, ensureOutDir, createBuildOptions } = require('./buildShared');

const modeArg = process.argv.find((arg) => arg.startsWith('--mode='));
const mode = modeArg ? modeArg.split('=')[1] : 'development';

async function startWatch() {
  ensureEntryFile();
  fs.rmSync(outDir, { recursive: true, force: true });
  ensureOutDir();

  const options = createBuildOptions({ mode });
  const ctx = await esbuild.context(options);
  await ctx.watch();

  console.log('Watching for changes...');

  const stop = async () => {
    await ctx.dispose();
    process.exit(0);
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

startWatch().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
