#!/usr/bin/env node

/**
 * require - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {'fs'} Refer to the implementation for the precise returned value.
 */
/**
 * require - Auto-generated documentation stub.
 *
 * @returns {'fs'} Result produced by require.
 */
const fs = require('fs');
/**
 * require - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {'esbuild'} Refer to the implementation for the precise returned value.
 */
/**
 * require - Auto-generated documentation stub.
 *
 * @returns {'esbuild'} Result produced by require.
 */
const esbuild = require('esbuild');
const {
  outDir,
  manifestFile,
  ensureEntryFile,
  ensureOutDir,
  updateIndexHtml,
  createBuildOptions,
/**
 * require - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {'./buildShared'} Refer to the implementation for the precise returned value.
 */
/**
 * require - Auto-generated documentation stub.
 *
 * @returns {'./buildShared'} Result produced by require.
 */
} = require('./buildShared');

/**
 * find - Auto-generated summary; refine if additional context is needed.
 */
const modeArg = process.argv.find((arg) => arg.startsWith('--mode='));
/**
 * split - Auto-generated summary; refine if additional context is needed.
 */
/**
 * split - Auto-generated documentation stub.
 */
const mode = modeArg ? modeArg.split('=')[1] : 'production';

/**
 * async  - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {buildBundle} Refer to the implementation for the precise returned value.
 *
 * @async
 */
/**
 * async  - Auto-generated documentation stub.
 *
 * @returns {buildBundle} Result produced by async .
 *
 * @async
 */
async function buildBundle() {
  /**
   * ensureEntryFile - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * ensureEntryFile - Auto-generated documentation stub.
   */
  ensureEntryFile();
  /**
   * rmSync - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} outDir - Parameter derived from the static analyzer.
   * @param {*} { recursive - Parameter derived from the static analyzer.
   * @param {*} force - Parameter derived from the static analyzer.
   *
   * @returns {outDir, { recursive: true, force: true }} Refer to the implementation for the precise returned value.
   */
  /**
   * rmSync - Auto-generated documentation stub.
   *
   * @param {*} outDir - Parameter forwarded to rmSync.
   * @param {*} { recursive - Parameter forwarded to rmSync.
   * @param {*} force - Parameter forwarded to rmSync.
   *
   * @returns {outDir, { recursive: true, force: true }} Result produced by rmSync.
   */
  fs.rmSync(outDir, { recursive: true, force: true });
  /**
   * ensureOutDir - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * ensureOutDir - Auto-generated documentation stub.
   */
  ensureOutDir();

  /**
   * createBuildOptions - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {{ mode }} Refer to the implementation for the precise returned value.
   */
  const options = createBuildOptions({ mode });
  /**
   * build - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {options} Refer to the implementation for the precise returned value.
   */
  /**
   * build - Auto-generated documentation stub.
   *
   * @returns {options} Result produced by build.
   */
  await esbuild.build(options);

  /**
   * parse - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} fs.readFileSync(manifestFile - Parameter derived from the static analyzer.
   * @param {*} 'utf8' - Parameter derived from the static analyzer.
   */
  /**
   * parse - Auto-generated documentation stub.
   *
   * @param {*} fs.readFileSync(manifestFile - Parameter forwarded to parse.
   * @param {*} 'utf8' - Parameter forwarded to parse.
   */
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  /**
   * updateIndexHtml - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {manifest} Refer to the implementation for the precise returned value.
   */
  /**
   * updateIndexHtml - Auto-generated documentation stub.
   *
   * @returns {manifest} Result produced by updateIndexHtml.
   */
  updateIndexHtml(manifest);
  /**
   * filter - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {Boolean} Refer to the implementation for the precise returned value.
   */
  /**
   * filter - Auto-generated documentation stub.
   *
   * @returns {Boolean} Result produced by filter.
   */
  const outputs = [manifest.js, manifest.css].filter(Boolean).join(', ');
  /**
   * log - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {`Build completed. Emitted ${outputs}`} Refer to the implementation for the precise returned value.
   */
  /**
   * log - Auto-generated documentation stub.
   *
   * @returns {`Build completed. Emitted ${outputs}`} Result produced by log.
   */
  console.log(`Build completed. Emitted ${outputs}`);
}

/**
 * buildBundle - Auto-generated summary; refine if additional context is needed.
 */
/**
 * buildBundle - Auto-generated documentation stub.
 */
buildBundle().catch((error) => {
  /**
   * error - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} error instanceof Error ? error.message - Parameter derived from the static analyzer.
   *
   * @returns {error instanceof Error ? error.message : error} Refer to the implementation for the precise returned value.
   */
  /**
   * error - Auto-generated documentation stub.
   *
   * @param {*} error instanceof Error ? error.message - Parameter forwarded to error.
   *
   * @returns {error instanceof Error ? error.message : error} Result produced by error.
   */
  console.error(error instanceof Error ? error.message : error);
  /**
   * exit - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {1} Refer to the implementation for the precise returned value.
   */
  /**
   * exit - Auto-generated documentation stub.
   *
   * @returns {1} Result produced by exit.
   */
  process.exit(1);
});
