#!/usr/bin/env node

/**
 * Generate API documentation from React TypeScript components
 * Using react-docgen-typescript for better TypeScript support
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { parse } = require('react-docgen-typescript');

// Paths
const SRC_DIR = path.resolve(__dirname, '../../ui');
const DOCS_DIR = path.resolve(__dirname, '../docs/api');

// Component categories based on Atomic Design
const CATEGORIES = {
  atoms: {
    pattern: 'atoms/**/*.tsx',
    title: 'Atoms',
    description: 'Basic building blocks - the smallest UI components',
    position: 1,
  },
  molecules: {
    pattern: 'molecules/**/*.tsx',
    title: 'Molecules',
    description: 'Simple combinations of atoms that work together',
    position: 2,
  },
  organisms: {
    pattern: 'organisms/**/*.tsx',
    title: 'Organisms',
    description: 'Complex UI components composed of molecules and atoms',
    position: 3,
  },
  templates: {
    pattern: 'templates/**/*.tsx',
    title: 'Templates',
    description: 'Page-level layouts that place components into structure',
    position: 4,
  },
  pages: {
    pattern: 'pages/**/*.tsx',
    title: 'Pages',
    description: 'Specific instances of templates with real content',
    position: 5,
  },
};

// Exclude patterns
const EXCLUDE_PATTERNS = [
  '**/*.test.tsx',
  '**/*.stories.tsx',
  '**/index.tsx',
  '**/types.tsx',
];

// Parser options
const parserOptions = {
  savePropValueAsString: true,
  shouldExtractLiteralValuesFromEnum: true,
  shouldRemoveUndefinedFromOptional: true,
  propFilter: (prop) => {
    // Filter out props from node_modules
    if (prop.parent) {
      return !/node_modules/.test(prop.parent.fileName);
    }
    return true;
  },
};

/**
 * Parse a component file and extract documentation
 */
function parseComponent(filePath) {
  try {
    const componentDocs = parse(filePath, parserOptions);
    
    if (componentDocs && componentDocs.length > 0) {
      return componentDocs;
    }
    
    return [];
  } catch (error) {
    console.warn(`⚠️  Could not parse ${path.relative(SRC_DIR, filePath)}:`, error.message);
    return [];
  }
}

/**
 * Format prop type for documentation
 */
function formatPropType(prop) {
  if (!prop.type) return 'unknown';
  
  const { name } = prop.type;
  
  // Clean up union types
  if (name && name.includes('|')) {
    return name.split('|').map(t => t.trim()).join(' | ');
  }
  
  return name || 'unknown';
}

/**
 * Generate markdown documentation for a component
 */
function generateComponentDoc(componentInfo) {
  const { displayName, description } = componentInfo;
  const props = componentInfo.props || {};
  
  let markdown = `\n## ${displayName}\n\n`;
  
  if (description) {
    markdown += `${description}\n\n`;
  }
  
  // Import statement
  const importPath = `@${path.basename(path.dirname(componentInfo.filePath))}/${displayName}`;
  markdown += `### Import\n\n\`\`\`tsx\nimport { ${displayName} } from '${importPath}';\n\`\`\`\n\n`;
  
  // Props table
  if (Object.keys(props).length > 0) {
    markdown += `### Props\n\n`;
    markdown += `| Prop | Type | Default | Required | Description |\n`;
    markdown += `|------|------|---------|----------|-------------|\n`;
    
    Object.entries(props).forEach(([propName, prop]) => {
      const type = formatPropType(prop);
      const required = prop.required ? '✓' : '';
      const defaultValue = prop.defaultValue?.value ? `\`${prop.defaultValue.value}\`` : '-';
      const desc = prop.description || '';
      
      markdown += `| \`${propName}\` | \`${type}\` | ${defaultValue} | ${required} | ${desc} |\n`;
    });
    
    markdown += `\n`;
  }
  
  // Example usage
  markdown += `### Example\n\n\`\`\`tsx\n<${displayName} />\n\`\`\`\n\n`;
  
  return markdown;
}

/**
 * Generate API documentation for a category
 */
function generateCategoryDocs(category, categoryKey) {
  const pattern = path.join(SRC_DIR, category.pattern);
  const files = glob.sync(pattern, {
    ignore: EXCLUDE_PATTERNS.map(p => path.join(SRC_DIR, p)),
  });
  
  console.log(`\n📂 ${category.title}`);
  console.log(`   Pattern: ${category.pattern}`);
  console.log(`   Found: ${files.length} file(s)`);
  
  const components = [];
  
  files.forEach(file => {
    const relativePath = path.relative(SRC_DIR, file);
    const componentDocs = parseComponent(file);
    
    if (componentDocs.length > 0) {
      console.log(`   ✅ ${relativePath} - ${componentDocs.length} component(s)`);
      components.push(...componentDocs);
    }
  });
  
  if (components.length === 0) {
    console.log(`   ⚠️  No components found`);
    return;
  }
  
  // Generate markdown
  let markdown = `---\nsidebar_position: ${category.position}\n---\n\n`;
  markdown += `# ${category.title} API\n\n`;
  markdown += `${category.description}\n\n`;
  
  // Table of contents
  markdown += `## Components\n\n`;
  components.forEach(comp => {
    markdown += `- [${comp.displayName}](#${comp.displayName.toLowerCase()})\n`;
  });
  markdown += `\n---\n`;
  
  // Component docs
  components.forEach(comp => {
    markdown += generateComponentDoc(comp);
    markdown += `---\n`;
  });
  
  // Write to file
  const outputPath = path.join(DOCS_DIR, `${categoryKey}.md`);
  fs.writeFileSync(outputPath, markdown, 'utf8');
  console.log(`   📝 Generated: ${path.relative(process.cwd(), outputPath)}`);
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Generating API Documentation\n');
  console.log(`Source: ${SRC_DIR}`);
  console.log(`Output: ${DOCS_DIR}\n`);
  
  // Ensure output directory exists
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }
  
  // Generate docs for each category
  Object.entries(CATEGORIES).forEach(([key, category]) => {
    generateCategoryDocs(category, key);
  });
  
  console.log('\n✨ API documentation generated successfully!\n');
}

main();
