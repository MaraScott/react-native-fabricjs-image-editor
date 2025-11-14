#!/usr/bin/env node

/**
 * JSDoc Documentation Generator
 * 
 * This script analyzes TypeScript/JavaScript files and generates proper JSDoc comments
 * based on code structure, types, and context.
 * 
 * Features:
 * - Analyzes React components, hooks, functions, classes
 * - Generates comprehensive JSDoc with proper tags
 * - Preserves existing good documentation
 * - Replaces auto-generated placeholder comments
 * - Supports TypeScript types and interfaces
 * 
 * Usage:
 *   node scripts/generateJSDoc.js [options]
 * 
 * Options:
 *   --path <path>     Specific file or directory to document (default: src/ui, src/store, src/utils)
 *   --dry-run         Show what would be changed without modifying files
 *   --force           Overwrite all JSDoc comments, even good ones
 *   --exclude <path>  Exclude paths (can be used multiple times)
 * 
 * @example
 *   node scripts/generateJSDoc.js --path src/ui/atoms
 *   node scripts/generateJSDoc.js --dry-run
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

// Configuration
const config = {
  targetPaths: ['ui', 'store', 'utils', 'shims'],
  excludePaths: ['docs', 'scripts', 'node_modules', 'dist', 'build'],
  fileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
  placeholderPatterns: [
    /Auto-generated (summary|documentation stub)/i,
    /Refer to the implementation for/i,
    /Parameter (derived from|forwarded to)/i,
    /Result produced by/i,
  ],
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  force: args.includes('--force'),
  path: null,
  exclude: [],
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--path' && args[i + 1]) {
    options.path = args[i + 1];
    i++;
  } else if (args[i] === '--exclude' && args[i + 1]) {
    options.exclude.push(args[i + 1]);
    i++;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 JSDoc Documentation Generator\n');
  
  if (options.dryRun) {
    console.log('🔍 Running in DRY RUN mode - no files will be modified\n');
  }

  const srcPath = path.resolve(__dirname, '..');
  const targetPaths = options.path 
    ? [path.resolve(srcPath, options.path)]
    : config.targetPaths.map(p => path.resolve(srcPath, p));

  let stats = {
    filesProcessed: 0,
    filesModified: 0,
    commentsAdded: 0,
    commentsImproved: 0,
  };

  for (const targetPath of targetPaths) {
    if (fs.existsSync(targetPath)) {
      await processPath(targetPath, stats);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Files processed: ${stats.filesProcessed}`);
  console.log(`   Files modified: ${stats.filesModified}`);
  console.log(`   Comments added: ${stats.commentsAdded}`);
  console.log(`   Comments improved: ${stats.commentsImproved}`);
  
  if (options.dryRun) {
    console.log('\n💡 Run without --dry-run to apply changes');
  }
}

/**
 * Process a file or directory path
 * @param {string} targetPath - Path to process
 * @param {Object} stats - Statistics object
 */
async function processPath(targetPath, stats) {
  const stat = fs.statSync(targetPath);
  
  if (stat.isDirectory()) {
    const entries = fs.readdirSync(targetPath);
    for (const entry of entries) {
      const fullPath = path.join(targetPath, entry);
      if (shouldProcess(fullPath)) {
        await processPath(fullPath, stats);
      }
    }
  } else if (stat.isFile() && shouldProcessFile(targetPath)) {
    await processFile(targetPath, stats);
  }
}

/**
 * Check if a path should be processed
 * @param {string} filePath - Path to check
 * @returns {boolean}
 */
function shouldProcess(filePath) {
  const relativePath = path.relative(path.resolve(__dirname, '..'), filePath);
  
  // Check exclude patterns
  if (config.excludePaths.some(ex => relativePath.includes(ex))) {
    return false;
  }
  
  if (options.exclude.some(ex => relativePath.includes(ex))) {
    return false;
  }
  
  return true;
}

/**
 * Check if a file should be processed
 * @param {string} filePath - File path to check
 * @returns {boolean}
 */
function shouldProcessFile(filePath) {
  return config.fileExtensions.some(ext => filePath.endsWith(ext));
}

/**
 * Process a single file
 * @param {string} filePath - File to process
 * @param {Object} stats - Statistics object
 */
async function processFile(filePath, stats) {
  const relativePath = path.relative(path.resolve(__dirname, '..'), filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  stats.filesProcessed++;
  
  // Check if file needs documentation
  const needsDoc = needsDocumentation(content);
  
  if (!needsDoc && !options.force) {
    return;
  }
  
  console.log(`📝 Processing: ${relativePath}`);
  
  try {
    const newContent = await documentFile(content, filePath);
    
    if (newContent !== content) {
      stats.filesModified++;
      
      if (!options.dryRun) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`   ✅ Updated`);
      } else {
        console.log(`   🔍 Would update`);
      }
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
}

/**
 * Check if content needs documentation
 * @param {string} content - File content
 * @returns {boolean}
 */
function needsDocumentation(content) {
  // Check for placeholder patterns
  return config.placeholderPatterns.some(pattern => pattern.test(content));
}

/**
 * Document a file's contents
 * @param {string} content - Original content
 * @param {string} filePath - File path for context
 * @returns {string} - Documented content
 */
function documentFile(content, filePath) {
  // Parse the TypeScript/JavaScript file
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') || filePath.endsWith('.jsx') 
      ? ts.ScriptKind.TSX 
      : ts.ScriptKind.TS
  );

  // Collect all nodes that need documentation
  const nodesToDocument = [];
  
  function visit(node) {
    // Check if node needs documentation
    if (shouldDocumentNode(node, content)) {
      nodesToDocument.push(node);
    }
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  
  // Sort nodes by position (reverse to modify from end to beginning)
  nodesToDocument.sort((a, b) => b.pos - a.pos);
  
  // Apply documentation
  let newContent = content;
  for (const node of nodesToDocument) {
    newContent = addOrImproveDocumentation(newContent, node, sourceFile);
  }
  
  return newContent;
}

/**
 * Check if a node should be documented
 * @param {ts.Node} node - AST node
 * @param {string} content - File content
 * @returns {boolean}
 */
function shouldDocumentNode(node, content) {
  // Document functions, classes, interfaces, types, components
  if (
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isClassDeclaration(node) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isVariableStatement(node) ||
    ts.isArrowFunction(node)
  ) {
    // Check if it already has good documentation
    const existingDoc = getExistingDocumentation(node, content);
    if (existingDoc && !isPlaceholderDoc(existingDoc) && !options.force) {
      return false;
    }
    return true;
  }
  
  return false;
}

/**
 * Get existing documentation for a node
 * @param {ts.Node} node - AST node
 * @param {string} content - File content
 * @returns {string|null}
 */
function getExistingDocumentation(node, content) {
  const nodeStart = node.getFullStart();
  const leadingComments = content.substring(Math.max(0, nodeStart - 500), nodeStart);
  
  // Find JSDoc comment
  const jsdocMatch = leadingComments.match(/\/\*\*[\s\S]*?\*\//g);
  if (jsdocMatch) {
    return jsdocMatch[jsdocMatch.length - 1];
  }
  
  return null;
}

/**
 * Check if documentation is a placeholder
 * @param {string} doc - Documentation string
 * @returns {boolean}
 */
function isPlaceholderDoc(doc) {
  return config.placeholderPatterns.some(pattern => pattern.test(doc));
}

/**
 * Add or improve documentation for a node
 * @param {string} content - File content
 * @param {ts.Node} node - AST node
 * @param {ts.SourceFile} sourceFile - Source file
 * @returns {string} - Modified content
 */
function addOrImproveDocumentation(content, node, sourceFile) {
  const nodeInfo = analyzeNode(node, sourceFile);
  if (!nodeInfo) return content;
  
  const jsdoc = generateJSDoc(nodeInfo);
  
  // Find insertion point
  const nodeStart = node.getFullStart();
  const existingDoc = getExistingDocumentation(node, content);
  
  if (existingDoc) {
    // Replace existing documentation
    const docStart = content.lastIndexOf(existingDoc, nodeStart);
    const docEnd = docStart + existingDoc.length;
    return content.substring(0, docStart) + jsdoc + content.substring(docEnd);
  } else {
    // Insert new documentation
    const leadingTrivia = content.substring(nodeStart, node.getStart(sourceFile));
    const insertPos = nodeStart + leadingTrivia.length;
    return content.substring(0, insertPos) + jsdoc + '\n' + content.substring(insertPos);
  }
}

/**
 * Analyze a node to extract information
 * @param {ts.Node} node - AST node
 * @param {ts.SourceFile} sourceFile - Source file
 * @returns {Object|null} - Node information
 */
function analyzeNode(node, sourceFile) {
  if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
    return analyzeFunctionNode(node, sourceFile);
  } else if (ts.isClassDeclaration(node)) {
    return analyzeClassNode(node, sourceFile);
  } else if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
    return analyzeTypeNode(node, sourceFile);
  } else if (ts.isVariableStatement(node)) {
    return analyzeVariableNode(node, sourceFile);
  }
  
  return null;
}

/**
 * Analyze a function or method node
 * @param {ts.Node} node - Function node
 * @param {ts.SourceFile} sourceFile - Source file
 * @returns {Object} - Function information
 */
function analyzeFunctionNode(node, sourceFile) {
  const name = node.name ? node.name.getText(sourceFile) : 'anonymous';
  const parameters = node.parameters ? node.parameters.map(p => ({
    name: p.name.getText(sourceFile),
    type: p.type ? p.type.getText(sourceFile) : 'any',
    optional: !!p.questionToken,
  })) : [];
  
  const returnType = node.type ? node.type.getText(sourceFile) : 'void';
  
  // Check if it's a React component (returns JSX)
  const isReactComponent = returnType.includes('JSX.Element') || 
                           returnType.includes('ReactElement') ||
                           returnType.includes('React.FC');
  
  return {
    type: 'function',
    name,
    parameters,
    returnType,
    isReactComponent,
    isHook: name.startsWith('use'),
  };
}

/**
 * Analyze a class node
 * @param {ts.Node} node - Class node
 * @param {ts.SourceFile} sourceFile - Source file
 * @returns {Object} - Class information
 */
function analyzeClassNode(node, sourceFile) {
  const name = node.name ? node.name.getText(sourceFile) : 'anonymous';
  
  return {
    type: 'class',
    name,
  };
}

/**
 * Analyze a type or interface node
 * @param {ts.Node} node - Type node
 * @param {ts.SourceFile} sourceFile - Source file
 * @returns {Object} - Type information
 */
function analyzeTypeNode(node, sourceFile) {
  const name = node.name.getText(sourceFile);
  
  return {
    type: ts.isInterfaceDeclaration(node) ? 'interface' : 'type',
    name,
  };
}

/**
 * Analyze a variable node
 * @param {ts.Node} node - Variable node
 * @param {ts.SourceFile} sourceFile - Source file
 * @returns {Object|null} - Variable information
 */
function analyzeVariableNode(node, sourceFile) {
  // Only document exported variables or React components
  const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
  if (!isExported) return null;
  
  const declaration = node.declarationList.declarations[0];
  const name = declaration.name.getText(sourceFile);
  
  // Check if it's a React component
  let isReactComponent = false;
  if (declaration.initializer) {
    const initText = declaration.initializer.getText(sourceFile);
    isReactComponent = initText.includes('=>') && 
                       (initText.includes('return') || initText.includes('JSX'));
  }
  
  return {
    type: 'variable',
    name,
    isReactComponent,
    isHook: name.startsWith('use'),
  };
}

/**
 * Generate JSDoc comment from node information
 * @param {Object} nodeInfo - Node information
 * @returns {string} - JSDoc comment
 */
function generateJSDoc(nodeInfo) {
  const lines = ['/**'];
  
  // Generate description based on node type
  if (nodeInfo.isReactComponent) {
    lines.push(` * ${nodeInfo.name} Component`);
    lines.push(` * `);
    lines.push(` * ${generateComponentDescription(nodeInfo)}`);
  } else if (nodeInfo.isHook) {
    lines.push(` * ${nodeInfo.name} Hook`);
    lines.push(` * `);
    lines.push(` * ${generateHookDescription(nodeInfo)}`);
  } else if (nodeInfo.type === 'interface' || nodeInfo.type === 'type') {
    lines.push(` * ${nodeInfo.name} ${nodeInfo.type === 'interface' ? 'Interface' : 'Type'}`);
    lines.push(` * `);
    lines.push(` * ${generateTypeDescription(nodeInfo)}`);
  } else if (nodeInfo.type === 'class') {
    lines.push(` * ${nodeInfo.name} Class`);
    lines.push(` * `);
    lines.push(` * ${generateClassDescription(nodeInfo)}`);
  } else {
    lines.push(` * ${nodeInfo.name}`);
    lines.push(` * `);
    lines.push(` * ${generateFunctionDescription(nodeInfo)}`);
  }
  
  // Add parameters
  if (nodeInfo.parameters && nodeInfo.parameters.length > 0) {
    lines.push(` * `);
    for (const param of nodeInfo.parameters) {
      const optional = param.optional ? '?' : '';
      lines.push(` * @param {${param.type}} ${param.name}${optional} - Parameter description`);
    }
  }
  
  // Add return type
  if (nodeInfo.returnType && nodeInfo.returnType !== 'void') {
    lines.push(` * @returns {${nodeInfo.returnType}} Return value description`);
  }
  
  lines.push(` */`);
  
  return lines.join('\n');
}

/**
 * Generate description for React component
 */
function generateComponentDescription(nodeInfo) {
  return `Renders the ${nodeInfo.name} component.`;
}

/**
 * Generate description for React hook
 */
function generateHookDescription(nodeInfo) {
  const hookName = nodeInfo.name.replace(/^use/, '').replace(/([A-Z])/g, ' $1').trim().toLowerCase();
  return `Custom hook for ${hookName}.`;
}

/**
 * Generate description for type/interface
 */
function generateTypeDescription(nodeInfo) {
  return `Type definition for ${nodeInfo.name}.`;
}

/**
 * Generate description for class
 */
function generateClassDescription(nodeInfo) {
  return `${nodeInfo.name} class implementation.`;
}

/**
 * Generate description for function
 */
function generateFunctionDescription(nodeInfo) {
  const funcName = nodeInfo.name.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
  return `Function to ${funcName}.`;
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
