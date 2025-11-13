/**
 * Meilisearch indexing script for Docusaurus
 * This script indexes all documentation pages into Meilisearch
 */

const { MeiliSearch } = require('meilisearch');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const MEILISEARCH_HOST = process.env.MEILI_HOST || 'http://localhost:7700';
const MEILISEARCH_API_KEY = process.env.MEILI_MASTER_KEY || 'tinyartist';
const INDEX_NAME = 'docs';
const BASE_URL = process.env.BASE_URL || '/wp-content/plugins/marascott-genai/src_expo/tinyartist-editor/assets/fabric-editor/src/docs/build/';

const client = new MeiliSearch({
  host: MEILISEARCH_HOST,
  apiKey: MEILISEARCH_API_KEY,
});

/**
 * Extract text content from markdown
 */
function extractTextContent(markdown) {
  // Remove code blocks
  let text = markdown.replace(/```[\s\S]*?```/g, '');
  // Remove inline code
  text = text.replace(/`[^`]+`/g, '');
  // Remove links but keep text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Remove images
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  // Remove headers markdown
  text = text.replace(/#{1,6}\s+/g, '');
  // Remove bold/italic
  text = text.replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1');
  // Clean extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

/**
 * Extract headings for hierarchy
 */
function extractHeadings(markdown) {
  const headings = [];
  const lines = markdown.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      headings.push({ level, text });
    }
  }
  
  return headings;
}

/**
 * Process a markdown file and extract searchable content
 */
function processMarkdownFile(filePath, docsPath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content: markdown } = matter(content);
  
  const relativePath = path.relative(docsPath, filePath);
  
  // Generate URL path with correct baseUrl
  let urlPath = relativePath
    .replace(/\.mdx?$/, '')
    .replace(/\\/g, '/')
    .replace(/\/index$/, '');
  
  // Handle intro.md as root docs page
  if (urlPath === 'intro') {
    urlPath = BASE_URL + 'docs/intro';
  } else {
    urlPath = BASE_URL + 'docs/' + urlPath;
  }
  
  const headings = extractHeadings(markdown);
  const textContent = extractTextContent(markdown);
  
  const title = frontmatter.title || (headings.length > 0 ? headings[0].text : path.basename(filePath, '.md'));
  
  return {
    id: relativePath.replace(/[\/\\]/g, '_').replace(/\.mdx?$/, ''),
    title,
    content: textContent,
    url: urlPath,
    hierarchy: headings.slice(0, 3).map(h => h.text),
    sidebar_position: frontmatter.sidebar_position || 999,
  };
}

/**
 * Recursively find all markdown files
 */
function findMarkdownFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findMarkdownFiles(filePath, fileList);
    } else if (file.match(/\.mdx?$/)) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

/**
 * Main indexing function
 */
async function indexDocumentation() {
  console.log('🚀 Starting Meilisearch indexing...\n');
  console.log(`Host: ${MEILISEARCH_HOST}`);
  console.log(`Index: ${INDEX_NAME}\n`);
  
  try {
    // Check if Meilisearch is healthy
    const health = await client.health();
    console.log('✅ Meilisearch is healthy:', health.status);
  } catch (error) {
    console.error('❌ Cannot connect to Meilisearch:', error.message);
    console.error('\nMake sure Meilisearch is running:');
    console.error('  docker-compose -f docker-compose.meilisearch.yml up -d');
    process.exit(1);
  }
  
  const docsPath = path.resolve(__dirname, '../docs');
  const markdownFiles = findMarkdownFiles(docsPath);
  
  console.log(`\n📄 Found ${markdownFiles.length} markdown files\n`);
  
  const documents = [];
  
  for (const filePath of markdownFiles) {
    try {
      const doc = processMarkdownFile(filePath, docsPath);
      documents.push(doc);
      console.log(`  ✓ ${path.relative(docsPath, filePath)}`);
    } catch (error) {
      console.error(`  ✗ Error processing ${filePath}:`, error.message);
    }
  }
  
  console.log(`\n📦 Indexing ${documents.length} documents into Meilisearch...\n`);
  
  try {
    // Create or get index
    const index = client.index(INDEX_NAME);
    
    // Configure searchable attributes
    await index.updateSearchableAttributes([
      'title',
      'content',
      'hierarchy',
    ]);
    
    // Configure filterable attributes
    await index.updateFilterableAttributes([
      'sidebar_position',
    ]);
    
    // Configure ranking rules
    await index.updateRankingRules([
      'words',
      'typo',
      'proximity',
      'attribute',
      'sort',
      'exactness',
    ]);
    
    // Add documents
    const task = await index.addDocuments(documents, { primaryKey: 'id' });
    console.log('✅ Documents added to index');
    console.log(`   Task ID: ${task.taskUid}`);
    console.log('⏳ Indexing in progress (processing asynchronously)...\n');
    
    // Get index stats
    const stats = await index.getStats();
    console.log(`📊 Index Stats:`);
    console.log(`   Documents: ${stats.numberOfDocuments}`);
    console.log(`   Index Size: ${(stats.indexSize / 1024).toFixed(2)} KB\n`);
    
    console.log('🎉 Meilisearch indexing successful!\n');
  } catch (error) {
    console.error('❌ Error indexing documents:', error);
    process.exit(1);
  }
}

// Run the indexing
indexDocumentation().catch(console.error);
