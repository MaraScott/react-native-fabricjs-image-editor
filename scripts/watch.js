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
const mode = modeArg ? modeArg.split('=')[1] : 'development';

async function startWatch() {
  ensureEntryFile();
  fs.rmSync(outDir, { recursive: true, force: true });
  ensureOutDir();

  const options = createBuildOptions({ mode });
  const ctx = await esbuild.context(options);
  await ctx.watch({
    onRebuild(error) {
      if (error) {
        console.error('Rebuild failed:', error);
        return;
      }

      try {
        const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
        updateIndexHtml(manifest);
        const outputs = [manifest.js, manifest.css].filter(Boolean).join(', ');
        console.log(`Rebuilt assets: ${outputs}`);
      } catch (readError) {
        updateIndexHtml();
        console.error('Rebuild completed, but the asset manifest could not be read.', readError);
      }
    },
  });

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    updateIndexHtml(manifest);
    const outputs = [manifest.js, manifest.css].filter(Boolean).join(', ');
    console.log(`Watching for changes... Latest assets: ${outputs}`);
  } catch (error) {
    updateIndexHtml();
    console.log('Watching for changes...');
  }

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
