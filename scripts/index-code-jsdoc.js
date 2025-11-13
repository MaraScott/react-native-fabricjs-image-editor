#!/usr/bin/env node

/**
 * Script to index JSDoc comments from TypeScript/JavaScript files into Meilisearch
 * This makes code documentation searchable
 */

/**
 * require - Auto-generated documentation stub.
 *
 * @returns {'fs'} Result produced by require.
 */
const fs = require('fs');
/**
 * require - Auto-generated documentation stub.
 *
 * @returns {'path'} Result produced by require.
 */
const path = require('path');
/**
 * require - Auto-generated documentation stub.
 *
 * @returns {'http'} Result produced by require.
 */
const http = require('http');

// Configuration
const MEILISEARCH_HOST = 'localhost';
const MEILISEARCH_PORT = 7700;
const MEILISEARCH_KEY = process.env.MEILI_MASTER_KEY || 'tinyartist';
const INDEX_NAME = 'code-docs';
/**
 * resolve - Auto-generated documentation stub.
 *
 * @param {*} __dirname - Parameter forwarded to resolve.
 * @param {*} '..' - Parameter forwarded to resolve.
 *
 * @returns {__dirname, '..'} Result produced by resolve.
 */
const SRC_DIR = path.resolve(__dirname, '..');
/**
 * join - Auto-generated documentation stub.
 *
 * @param {*} SRC_DIR - Parameter forwarded to join.
 * @param {*} 'docs' - Parameter forwarded to join.
 *
 * @returns {SRC_DIR, 'docs'} Result produced by join.
 */
const DOCS_DIR = path.join(SRC_DIR, 'docs');

const EXCLUDE_PATTERNS = [
  '/docs/',
  '/node_modules/',
  '/.git/',
  '/dist/',
  '/build/',
  '.min.js',
  '.bundle.js'
];

/**
 * Check if a file should be excluded
 * @param {string} filePath - The file path to check
 * @returns {boolean} True if file should be excluded
 */
/**
 * shouldExclude - Auto-generated documentation stub.
 *
 * @returns {filePath} Result produced by shouldExclude.
 */
function shouldExclude(filePath) {
  /**
   * some - Auto-generated documentation stub.
   */
  return EXCLUDE_PATTERNS.some(pattern => filePath.includes(pattern));
}

/**
 * Get all TypeScript/JavaScript files recursively
 * @param {string} dir - Directory to search
 * @param {string[]} fileList - Accumulated file list
 * @returns {string[]} List of file paths
 */
/**
 * getAllFiles - Auto-generated documentation stub.
 *
 * @param {*} dir - Parameter forwarded to getAllFiles.
 * @param {*} fileList = [] - Parameter forwarded to getAllFiles.
 */
function getAllFiles(dir, fileList = []) {
  /**
   * readdirSync - Auto-generated documentation stub.
   *
   * @returns {dir} Result produced by readdirSync.
   */
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    /**
     * if - Auto-generated documentation stub.
     */
    if (shouldExclude(filePath)) {
      return;
    }

    /**
     * statSync - Auto-generated documentation stub.
     *
     * @returns {filePath} Result produced by statSync.
     */
    const stat = fs.statSync(filePath);
    
    /**
     * if - Auto-generated documentation stub.
     */
    if (stat.isDirectory()) {
      /**
       * getAllFiles - Auto-generated documentation stub.
       *
       * @param {*} filePath - Parameter forwarded to getAllFiles.
       * @param {*} fileList - Parameter forwarded to getAllFiles.
       *
       * @returns {filePath, fileList} Result produced by getAllFiles.
       */
      getAllFiles(filePath, fileList);
    /**
     * if - Auto-generated documentation stub.
     */
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      /**
       * push - Auto-generated documentation stub.
       *
       * @returns {filePath} Result produced by push.
       */
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Extract JSDoc comments from file content
 * @param {string} content - File content
 * @param {string} filePath - Path to the file
 * @returns {Array<object>} Array of JSDoc entries
 */
/**
 * extractJSDocComments - Auto-generated documentation stub.
 *
 * @param {*} content - Parameter forwarded to extractJSDocComments.
 * @param {*} filePath - Parameter forwarded to extractJSDocComments.
 *
 * @returns {content, filePath} Result produced by extractJSDocComments.
 */
function extractJSDocComments(content, filePath) {
  const entries = [];
  /**
   * split - Auto-generated documentation stub.
   *
   * @returns {'\n'} Result produced by split.
   */
  const lines = content.split('\n');
  
  let i = 0;
  /**
   * while - Auto-generated documentation stub.
   *
   * @returns {i < lines.length} Result produced by while.
   */
  while (i < lines.length) {
    const line = lines[i];
    
    // Look for JSDoc start
    /**
     * if - Auto-generated documentation stub.
     */
    if (line.trim().startsWith('/**')) {
      const jsdocStart = i;
      const jsdocLines = [line];
      i++;
      
      // Collect JSDoc lines
      /**
       * while - Auto-generated documentation stub.
       */
      while (i < lines.length && !lines[i].trim().endsWith('*/')) {
        /**
         * push - Auto-generated documentation stub.
         *
         * @returns {lines[i]} Result produced by push.
         */
        jsdocLines.push(lines[i]);
        i++;
      }
      
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {i < lines.length} Result produced by if.
       */
      if (i < lines.length) {
        /**
         * push - Auto-generated documentation stub.
         *
         * @returns {lines[i]} Result produced by push.
         */
        jsdocLines.push(lines[i]); // Add closing */
        i++;
      }
      
      /**
       * line - Auto-generated documentation stub.
       *
       * @returns {the code being documented} Result produced by line.
       */
      // Get the next non-empty line (the code being documented)
      let codeLine = '';
      let codeLineNum = i;
      /**
       * while - Auto-generated documentation stub.
       *
       * @returns {codeLineNum < lines.length} Result produced by while.
       */
      while (codeLineNum < lines.length) {
        /**
         * trim - Auto-generated documentation stub.
         */
        const nextLine = lines[codeLineNum].trim();
        /**
         * if - Auto-generated documentation stub.
         */
        if (nextLine && !nextLine.startsWith('//')) {
          codeLine = nextLine;
          break;
        }
        codeLineNum++;
      }
      
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {codeLine} Result produced by if.
       */
      if (codeLine) {
        // Extract function/class/interface name
        /**
         * match - Auto-generated documentation stub.
         *
         * @param {*} /(? - Parameter forwarded to match.
         */
        const nameMatch = codeLine.match(/(?:class|interface|function|const|let|var)\s+(\w+)|(\w+)\s*[:=]/);
        const name = nameMatch ? (nameMatch[1] || nameMatch[2]) : 'Unknown';
        
        // Extract description
        /**
         * join - Auto-generated documentation stub.
         *
         * @returns {'\n'} Result produced by join.
         */
        const descMatch = jsdocLines.join('\n').match(/\*\s+(.+?)(?:\n|\*\s+@)/);
        /**
         * trim - Auto-generated documentation stub.
         *
         * @returns {'';} Result produced by trim.
         */
        const description = descMatch ? descMatch[1].trim() : '';
        
        // Extract @param tags
        const params = [];
        jsdocLines.forEach(line => {
          /**
           * match - Auto-generated documentation stub.
           */
          const paramMatch = line.match(/\*\s+@param\s+\{([^}]+)\}\s+(\w+)\s*-?\s*(.*)/);
          /**
           * if - Auto-generated documentation stub.
           *
           * @returns {paramMatch} Result produced by if.
           */
          if (paramMatch) {
            params.push({
              type: paramMatch[1],
              name: paramMatch[2],
              description: paramMatch[3]
            });
          }
        });
        
        // Extract @returns tag
        /**
         * join - Auto-generated documentation stub.
         *
         * @returns {'\n'} Result produced by join.
         */
        const returnsMatch = jsdocLines.join('\n').match(/\*\s+@returns\s+\{([^}]+)\}\s*(.*)/);
        const returns = returnsMatch ? {
          type: returnsMatch[1],
          description: returnsMatch[2]
        } : null;
        
        // Build searchable content
        const searchableContent = [
          name,
          description,
          /**
           * map - Auto-generated documentation stub.
           */
          ...params.map(p => `${p.name} ${p.description}`),
          returns ? returns.description : '',
          codeLine
        /**
         * filter - Auto-generated documentation stub.
         *
         * @returns {Boolean} Result produced by filter.
         */
        ].filter(Boolean).join(' ');
        
        /**
         * ID - Auto-generated documentation stub.
         *
         * @param {*} alphanumeric - Parameter forwarded to ID.
         * @param {*} hyphens - Parameter forwarded to ID.
         * @param {*} underscores only - Parameter forwarded to ID.
         *
         * @returns {alphanumeric, hyphens, underscores only} Result produced by ID.
         */
        // Generate valid Meilisearch document ID (alphanumeric, hyphens, underscores only)
        /**
         * relative - Auto-generated documentation stub.
         *
         * @param {*} SRC_DIR - Parameter forwarded to relative.
         * @param {*} filePath - Parameter forwarded to relative.
         *
         * @returns {SRC_DIR, filePath} Result produced by relative.
         */
        const relativeFile = path.relative(SRC_DIR, filePath);
        /**
         * replace - Auto-generated documentation stub.
         *
         * @param {*} /[^a-zA-Z0-9-_]/g - Parameter forwarded to replace.
         * @param {*} '-' - Parameter forwarded to replace.
         *
         * @returns {/[^a-zA-Z0-9-_]/g, '-'} Result produced by replace.
         */
        const validId = `${relativeFile.replace(/[^a-zA-Z0-9-_]/g, '-')}-line-${jsdocStart}`;
        
        // Generate URL - since code files don't have doc pages, use GitHub-style path format
        // This can be adapted to point to your source control or IDE
        const url = `vscode://file${filePath}:${jsdocStart + 1}`;
        
        const entry = {
          id: validId,
          name,
          description,
          params,
          returns,
          code: codeLine,
          file: relativeFile,
          line: jsdocStart + 1,
          url: url,
          content: searchableContent,
          type: codeLine.includes('class') ? 'class' :
                codeLine.includes('interface') ? 'interface' : 'function'
        };
        
        // Debug: print first entry to verify URL is included
        if (entries.length === 0 && name === 'handleOverlayRotatePointerDown') {
          console.log('DEBUG: Sample entry:', JSON.stringify(entry, null, 2));
        }
        
        entries.push(entry);
      }
    }
    
    i++;
  }
  
  return entries;
}

/**
 * Make HTTP request to Meilisearch
 * @param {string} method - HTTP method
 * @param {string} path - API path
 * @param {object} data - Request body
 * @returns {Promise<object>} Response data
 */
/**
 * makeRequest - Auto-generated documentation stub.
 *
 * @param {*} method - Parameter forwarded to makeRequest.
 * @param {*} path - Parameter forwarded to makeRequest.
 * @param {*} data = null - Parameter forwarded to makeRequest.
 */
function makeRequest(method, path, data = null) {
  /**
   * Promise - Auto-generated documentation stub.
   *
   * @param {*} (resolve - Parameter forwarded to Promise.
   * @param {*} reject - Parameter forwarded to Promise.
   */
  return new Promise((resolve, reject) => {
    const options = {
      hostname: MEILISEARCH_HOST,
      port: MEILISEARCH_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MEILISEARCH_KEY}`
      }
    };

    /**
     * request - Auto-generated documentation stub.
     *
     * @param {*} options - Parameter forwarded to request.
     * @param {*} (res - Parameter forwarded to request.
     */
    const req = http.request(options, (res) => {
      let body = '';
      /**
       * on - Auto-generated documentation stub.
       *
       * @param {*} 'data' - Parameter forwarded to on.
       * @param {*} chunk => body += chunk - Parameter forwarded to on.
       */
      res.on('data', chunk => body += chunk);
      /**
       * on - Auto-generated documentation stub.
       *
       * @param {*} 'end' - Parameter forwarded to on.
       * @param {*} ( - Parameter forwarded to on.
       */
      res.on('end', () => {
        try {
          /**
           * parse - Auto-generated documentation stub.
           *
           * @returns {body} Result produced by parse.
           */
          const response = JSON.parse(body);
          /**
           * resolve - Auto-generated documentation stub.
           *
           * @returns {response} Result produced by resolve.
           */
          resolve(response);
        /**
         * catch - Auto-generated documentation stub.
         *
         * @returns {e} Result produced by catch.
         */
        } catch (e) {
          /**
           * resolve - Auto-generated documentation stub.
           *
           * @returns {{ body }} Result produced by resolve.
           */
          resolve({ body });
        }
      });
    });

    /**
     * on - Auto-generated documentation stub.
     *
     * @param {*} 'error' - Parameter forwarded to on.
     * @param {*} reject - Parameter forwarded to on.
     *
     * @returns {'error', reject} Result produced by on.
     */
    req.on('error', reject);
    
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {data} Result produced by if.
     */
    if (data) {
      /**
       * write - Auto-generated documentation stub.
       */
      req.write(JSON.stringify(data));
    }
    
    /**
     * end - Auto-generated documentation stub.
     */
    req.end();
  });
}

/**
 * Main execution function
 */
/**
 * async  - Auto-generated documentation stub.
 *
 * @returns {main} Result produced by async .
 *
 * @async
 */
async function main() {
  /**
   * log - Auto-generated documentation stub.
   *
   * @returns {'🔍 Searching for files with JSDoc comments...\n'} Result produced by log.
   */
  console.log('🔍 Searching for files with JSDoc comments...\n');
  
  /**
   * getAllFiles - Auto-generated documentation stub.
   *
   * @returns {SRC_DIR} Result produced by getAllFiles.
   */
  const files = getAllFiles(SRC_DIR);
  /**
   * log - Auto-generated documentation stub.
   *
   * @returns {`Found ${files.length} TypeScript/JavaScript files\n`} Result produced by log.
   */
  console.log(`Found ${files.length} TypeScript/JavaScript files\n`);

  console.log('📝 Extracting JSDoc comments...\n');
  
  const allEntries = [];
  files.forEach(filePath => {
    /**
     * readFileSync - Auto-generated documentation stub.
     *
     * @param {*} filePath - Parameter forwarded to readFileSync.
     * @param {*} 'utf-8' - Parameter forwarded to readFileSync.
     *
     * @returns {filePath, 'utf-8'} Result produced by readFileSync.
     */
    const content = fs.readFileSync(filePath, 'utf-8');
    /**
     * extractJSDocComments - Auto-generated documentation stub.
     *
     * @param {*} content - Parameter forwarded to extractJSDocComments.
     * @param {*} filePath - Parameter forwarded to extractJSDocComments.
     *
     * @returns {content, filePath} Result produced by extractJSDocComments.
     */
    const entries = extractJSDocComments(content, filePath);
    /**
     * push - Auto-generated documentation stub.
     *
     * @returns {...entries} Result produced by push.
     */
    allEntries.push(...entries);
    
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {entries.length > 0} Result produced by if.
     */
    if (entries.length > 0) {
      /**
       * relative - Auto-generated documentation stub.
       *
       * @param {*} SRC_DIR - Parameter forwarded to relative.
       * @param {*} filePath - Parameter forwarded to relative.
       *
       * @returns {SRC_DIR, filePath} Result produced by relative.
       */
      const relativePath = path.relative(SRC_DIR, filePath);
      /**
       * log - Auto-generated documentation stub.
       *
       * @param {*} `  ${relativePath} - Parameter forwarded to log.
       *
       * @returns {`  ${relativePath}: ${entries.length} entries`} Result produced by log.
       */
      console.log(`  ${relativePath}: ${entries.length} entries`);
    }
  });

  /**
   * log - Auto-generated documentation stub.
   *
   * @returns {`\n✅ Extracted ${allEntries.length} JSDoc entries\n`} Result produced by log.
   */
  console.log(`\n✅ Extracted ${allEntries.length} JSDoc entries\n`);

  /**
   * log - Auto-generated documentation stub.
   *
   * @returns {'🔄 Indexing to Meilisearch...\n'} Result produced by log.
   */
  console.log('🔄 Indexing to Meilisearch...\n');

  try {
    // Create/update index
    await makeRequest('POST', `/indexes`, {
      uid: INDEX_NAME,
      primaryKey: 'id'
    });

    // Configure searchable attributes
    await makeRequest('PUT', `/indexes/${INDEX_NAME}/settings/searchable-attributes`, [
      'name',
      'description',
      'content',
      'file'
    ]);

    // Configure filterable attributes
    await makeRequest('PUT', `/indexes/${INDEX_NAME}/settings/filterable-attributes`, [
      'type',
      'file'
    ]);

    // Add documents
    // Debug: Check if URL field is in the data before sending
    const sampleEntry = allEntries.find(e => e.name === 'handleOverlayRotatePointerDown');
    if (sampleEntry) {
      console.log('DEBUG: Sample entry before indexing:', JSON.stringify(sampleEntry, null, 2));
    }
    
    const result = await makeRequest('POST', `/indexes/${INDEX_NAME}/documents`, allEntries);
    /**
     * log - Auto-generated documentation stub.
     *
     * @param {*} `✅ Indexing task created - Parameter forwarded to log.
     *
     * @returns {`✅ Indexing task created: ${result.taskUid || result.uid}\n`} Result produced by log.
     */
    console.log(`✅ Indexing task created: ${result.taskUid || result.uid}\n`);

    /**
     * log - Auto-generated documentation stub.
     */
    console.log('='.repeat(60));
    /**
     * log - Auto-generated documentation stub.
     *
     * @param {*} '📊 Summary - Parameter forwarded to log.
     *
     * @returns {'📊 Summary:'} Result produced by log.
     */
    console.log('📊 Summary:');
    /**
     * log - Auto-generated documentation stub.
     */
    console.log('='.repeat(60));
    /**
     * log - Auto-generated documentation stub.
     *
     * @param {*} `Total JSDoc entries indexed - Parameter forwarded to log.
     *
     * @returns {`Total JSDoc entries indexed: ${allEntries.length}`} Result produced by log.
     */
    console.log(`Total JSDoc entries indexed: ${allEntries.length}`);
    /**
     * log - Auto-generated documentation stub.
     *
     * @param {*} `Functions - Parameter forwarded to log.
     */
    console.log(`Functions: ${allEntries.filter(e => e.type === 'function').length}`);
    /**
     * log - Auto-generated documentation stub.
     *
     * @param {*} `Classes - Parameter forwarded to log.
     */
    console.log(`Classes: ${allEntries.filter(e => e.type === 'class').length}`);
    /**
     * log - Auto-generated documentation stub.
     *
     * @param {*} `Interfaces - Parameter forwarded to log.
     */
    console.log(`Interfaces: ${allEntries.filter(e => e.type === 'interface').length}`);
    /**
     * log - Auto-generated documentation stub.
     */
    console.log('='.repeat(60));
    /**
     * log - Auto-generated documentation stub.
     *
     * @returns {'\n✨ Done! JSDoc comments are now searchable in Meilisearch.'} Result produced by log.
     */
    console.log('\n✨ Done! JSDoc comments are now searchable in Meilisearch.');
    /**
     * log - Auto-generated documentation stub.
     *
     * @param {*} `   Index - Parameter forwarded to log.
     *
     * @returns {`   Index: ${INDEX_NAME}`} Result produced by log.
     */
    console.log(`   Index: ${INDEX_NAME}`);
    /**
     * log - Auto-generated documentation stub.
     *
     * @param {*} `   Search example - Parameter forwarded to log.
     *
     * @returns {`   Search example: curl -X POST 'http://localhost:7700/indexes/${INDEX_NAME}/search' \\`} Result produced by log.
     */
    console.log(`   Search example: curl -X POST 'http://localhost:7700/indexes/${INDEX_NAME}/search' \\`);
    /**
     * log - Auto-generated documentation stub.
     *
     * @param {*} `     -H 'Authorization - Parameter forwarded to log.
     *
     * @returns {`     -H 'Authorization: Bearer ${MEILISEARCH_KEY}' \\`} Result produced by log.
     */
    console.log(`     -H 'Authorization: Bearer ${MEILISEARCH_KEY}' \\`);
    /**
     * log - Auto-generated documentation stub.
     *
     * @param {*} `     -H 'Content-Type - Parameter forwarded to log.
     *
     * @returns {`     -H 'Content-Type: application/json' \\`} Result produced by log.
     */
    console.log(`     -H 'Content-Type: application/json' \\`);
    /**
     * log - Auto-generated documentation stub.
     *
     * @param {*} `     --data-binary '{"q" - Parameter forwarded to log.
     *
     * @returns {`     --data-binary '{"q":"handleOverlayRotatePointerDown"}'`} Result produced by log.
     */
    console.log(`     --data-binary '{"q":"handleOverlayRotatePointerDown"}'`);
    
  /**
   * catch - Auto-generated documentation stub.
   *
   * @returns {error} Result produced by catch.
   */
  } catch (error) {
    /**
     * error - Auto-generated documentation stub.
     *
     * @param {*} '❌ Error indexing to Meilisearch - Parameter forwarded to error.
     * @param {*} error.message - Parameter forwarded to error.
     *
     * @returns {'❌ Error indexing to Meilisearch:', error.message} Result produced by error.
     */
    console.error('❌ Error indexing to Meilisearch:', error.message);
    /**
     * exit - Auto-generated documentation stub.
     *
     * @returns {1} Result produced by exit.
     */
    process.exit(1);
  }
}

// Run the script
/**
 * if - Auto-generated documentation stub.
 */
if (require.main === module) {
  /**
   * main - Auto-generated documentation stub.
   */
  main();
}

module.exports = { extractJSDocComments };
