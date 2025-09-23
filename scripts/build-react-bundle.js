#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function main() {
  const parts = [
    '// Fabric.js runtime',
    read('vendor/fabric.min.js'),
    '\n// React-lite runtime',
    read('lib/react-lite.js'),
    '\n// React application',
    read('lib/react-app.js')
  ];

  const bundle = parts.join('\n');
  const outDir = path.join(__dirname, '..', 'dist');
  ensureDir(outDir);
  fs.writeFileSync(path.join(outDir, 'react-app.bundle.js'), bundle, 'utf8');
  console.log('Built dist/react-app.bundle.js');
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
