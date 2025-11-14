// This script scans all .tsx files in the src/ui/molecules directory for render functions that return arrays
// and checks if all elements in those arrays have a key prop. It prints warnings for any arrays with missing keys.
// Usage: Run with ts-node or node after transpiling if needed.

const fs = require('fs');
const path = require('path');

// Adjusted path for the actual workspace structure
const MOLECULES_DIR = path.join(__dirname, '..', 'ui');

function walk(dir, ext = '.tsx') {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(walk(full, ext));
    } else if (full.endsWith(ext)) {
      results.push(full);
    }
  });
  return results;
}

function checkRenderArrays(file) {
  const content = fs.readFileSync(file, 'utf8');
  // Find render: () => [ ... ] or render() { return [ ... ] }
  const arrayReturnRegex = /render\s*[:=]\s*\(.*?\)\s*=>\s*\[([\s\S]*?)\]/g;
  let match;
  let found = false;
  while ((match = arrayReturnRegex.exec(content))) {
    found = true;
    const arr = match[1];
    // Check for key= in each JSX element in the array
    const jsxElementRegex = /<([A-Z][A-Za-z0-9]*)\s+([^>]*?)(?=>)/g;
    let jsxMatch;
    let missingKey = false;
    while ((jsxMatch = jsxElementRegex.exec(arr))) {
      if (!/key\s*=/.test(jsxMatch[2])) {
        missingKey = true;
        console.warn(`Missing key prop in array element <${jsxMatch[1]}> in file ${file}`);
      }
    }
    if (!missingKey) {
      console.log(`All array elements in render() in ${file} have keys.`);
    }
  }
  if (!found) {
    // Also check for return [ ... ]
    const returnArrayRegex = /return\s*\[([\s\S]*?)\];/g;
    while ((match = returnArrayRegex.exec(content))) {
      const arr = match[1];
      const jsxElementRegex = /<([A-Z][A-Za-z0-9]*)\s+([^>]*?)(?=>)/g;
      let jsxMatch;
      let missingKey = false;
      while ((jsxMatch = jsxElementRegex.exec(arr))) {
        if (!/key\s*=/.test(jsxMatch[2])) {
          missingKey = true;
          console.warn(`Missing key prop in array element <${jsxMatch[1]}> in file ${file}`);
        }
      }
      if (!missingKey) {
        console.log(`All array elements in return [] in ${file} have keys.`);
      }
    }
  }
}

function main() {
  const files = walk(MOLECULES_DIR);
  files.forEach(checkRenderArrays);
}

main();
