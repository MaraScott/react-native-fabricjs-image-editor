#!/usr/bin/env node

/**
 * Generate API documentation from React components using react-docgen
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const docgen = require('react-docgen');

// Paths
const SRC_DIR = path.resolve(__dirname, '../../ui');
const DOCS_DIR = path.resolve(__dirname, '../docs/api');

// Component categories based on Atomic Design
const CATEGORIES = {
  atoms: {
    pattern: 'atoms/**/*.tsx',
    title: 'Atoms',
    description: 'Basic building blocks - the smallest UI components',
  },
  molecules: {
    pattern: 'molecules/**/*.tsx',
    title: 'Molecules',
    description: 'Simple combinations of atoms that work together',
  },
  organisms: {
    pattern: 'organisms/**/*.tsx',
    title: 'Organisms',
    description: 'Complex UI components composed of molecules and atoms',
  },
  templates: {
    pattern: 'templates/**/*.tsx',
    title: 'Templates',
    description: 'Page-level layouts that place components into structure',
  },
  pages: {
    pattern: 'pages/**/*.tsx',
    title: 'Pages',
    description: 'Specific instances of templates with real content',
  },
};

// Exclude patterns
const EXCLUDE_PATTERNS = [
  '**/*.test.tsx',
  '**/*.stories.tsx',
  '**/index.tsx',
  '**/types/**',
  '**/utils/**',
];

/**
 * Parse a component file and extract documentation
 */
function parseComponent(filePath) {
  try {
    const source = fs.readFileSync(filePath, 'utf8');
    let componentInfo = docgen.parse(source);
    
    // react-docgen returns an array, ensure we always have an array
    if (!Array.isArray(componentInfo)) {
      componentInfo = [componentInfo];
    }
    
    return componentInfo.filter(info => info && info.displayName);
  } catch (error) {
    console.warn(`Warning: Could not parse ${path.relative(SRC_DIR, filePath)}:`, error.message);
    return [];
  }
}

/**
 * Format prop type for documentation
 */
function formatPropType(prop) {
  if (!prop.flowType && !prop.type) return 'unknown';
  
  const typeInfo = prop.flowType || prop.type;
  const { name, value, raw } = typeInfo;
  
  if (name === 'enum' || name === 'union') {
    if (value && Array.isArray(value)) {
      return value.map(v => {
        if (v.value) return v.value.replace(/'/g, '');
        if (v.name === 'literal') return v.value.replace(/'/g, '');
        return v.name || v.value || 'unknown';
      }).join(' \\| ');
    }
    return raw || name;
  }
  
  return raw || name || 'unknown';
}

/**
 * Generate markdown documentation for a component
 */
function generateComponentDoc(componentInfo, filePath) {
  const { displayName, description, props } = componentInfo;
  
  if (!displayName) return '';
  
  let markdown = `## ${displayName}\n\n`;
  
  if (description) {
    markdown += `${description}\n\n`;
  }
  
  // Import statement
  const relativePath = path.relative(SRC_DIR, filePath).replace(/\.tsx$/, '');
  const importPath = '@' + relativePath.replace(/\\/g, '/');
  markdown += `### Import\n\n`;
  markdown += `\`\`\`tsx\nimport { ${displayName} } from '${importPath}';\n\`\`\`\n\n`;
  
  // Props table
  if (props && Object.keys(props).length > 0) {
    markdown += `### Props\n\n`;
    markdown += `| Prop | Type | Default | Required | Description |\n`;
    markdown += `|------|------|---------|----------|-------------|\n`;
    
    Object.entries(props).forEach(([propName, propInfo]) => {
      const type = formatPropType(propInfo);
      const defaultValue = propInfo.defaultValue ? `\`${propInfo.defaultValue.value}\`` : '-';
      const required = propInfo.required ? '✓' : '';
      const desc = (propInfo.description || '').replace(/\n/g, ' ');
      
      markdown += `| \`${propName}\` | \`${type}\` | ${defaultValue} | ${required} | ${desc} |\n`;
    });
    
    markdown += `\n`;
  }
  
  // Example
  markdown += `### Example\n\n`;
  markdown += `\`\`\`tsx\n<${displayName} />\n\`\`\`\n\n`;
  markdown += `---\n\n`;
  
  return markdown;
}

/**
 * Generate documentation for a category
 */
function generateCategoryDocs(category, categoryInfo) {
  console.log(`\nGenerating docs for ${categoryInfo.title}...`);
  
  const pattern = path.join(SRC_DIR, categoryInfo.pattern);
  const files = glob.sync(pattern, {
    ignore: EXCLUDE_PATTERNS.map(p => path.join(SRC_DIR, p)),
  });
  
  console.log(`Found ${files.length} component files`);
  
  let markdown = `---\nsidebar_position: ${Object.keys(CATEGORIES).indexOf(category) + 1}\n---\n\n`;
  markdown += `# ${categoryInfo.title} API\n\n`;
  markdown += `${categoryInfo.description}\n\n`;
  
  const components = [];
  
  files.forEach(file => {
    const componentInfos = parseComponent(file);
    if (componentInfos && componentInfos.length > 0) {
      componentInfos.forEach(info => {
        if (info && info.displayName) {
          components.push({ info, file });
        }
      });
    }
  });
  
  console.log(`Parsed ${components.length} components`);
  
  if (components.length === 0) {
    markdown += `*No components found in this category yet.*\n\n`;
  } else {
    // Sort components alphabetically
    components.sort((a, b) => a.info.displayName.localeCompare(b.info.displayName));
    
    // Generate table of contents
    markdown += `## Components\n\n`;
    components.forEach(({ info }) => {
      markdown += `- [${info.displayName}](#${info.displayName.toLowerCase()})\n`;
    });
    markdown += `\n---\n\n`;
    
    // Generate documentation for each component
    components.forEach(({ info, file }) => {
      markdown += generateComponentDoc(info, file);
    });
  }
  
  // Write documentation file
  const outputPath = path.join(DOCS_DIR, `${category}.md`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown, 'utf8');
  
  console.log(`✓ Generated ${outputPath}`);
}

/**
 * Main function
 */
function main() {
  console.log('Generating API documentation from React components...\n');
  console.log(`Source directory: ${SRC_DIR}`);
  console.log(`Output directory: ${DOCS_DIR}\n`);
  
  // Generate docs for each category
  Object.entries(CATEGORIES).forEach(([category, info]) => {
    generateCategoryDocs(category, info);
  });
  
  console.log('\n✓ Documentation generation complete!');
}

// Run
main();
