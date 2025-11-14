#!/usr/bin/env node
/**
 * Atomic Design Linter for React Projects
 * Checks for atomic design violations in the src/ui directory.
 * - Atoms: no business logic, no state, no cross-layer imports
 * - Molecules: only combine atoms, minimal state, no business logic
 * - Organisms: combine molecules/atoms, can have state/logic
 * - No cross-layer imports (e.g., molecules importing organisms)
 * - No components/ subfolders in molecules/organisms
 */
const fs = require('fs');
const path = require('path');

const UI_ROOT = path.resolve(__dirname, '../ui');
const LEVELS = ['atoms', 'molecules', 'organisms', 'templates', 'pages'];
/** @type {string[]} */
const ERRORS = [];

/**
 * @param {string} dir
 * @param {(file: string) => void} cb
 */
function walk(dir, cb) {
  fs.readdirSync(dir).forEach((file) => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full, cb);
    } else {
      cb(full);
    }
  });
}

/**
 * @param {string} file
 * @param {string} level
 */
function checkImports(file, level) {
  const content = fs.readFileSync(file, 'utf8');
  // No cross-layer imports
  LEVELS.forEach((other) => {
    if (other === level) return;
  const regex = new RegExp(`@${other}[\\/\\\\]`, 'g');
    if (regex.test(content)) {
      ERRORS.push(`${file}: imports from @${other} (cross-layer)`);
    }
  });
  // Atoms: no useState/useEffect/useReducer
  if (level === 'atoms') {
    if (/use(State|Effect|Reducer)/.test(content)) {
      ERRORS.push(`${file}: atom contains React state or effect`);
    }
  }
  // Molecules: no business logic (heuristic: no useReducer, minimal useState)
  if (level === 'molecules') {
    if (/useReducer/.test(content)) {
      ERRORS.push(`${file}: molecule contains useReducer (business logic)`);
    }
  }
  // No components/ subfolders
  if (/components[\/]/.test(file)) {
    ERRORS.push(`${file}: components/ subfolder is not allowed in atomic design`);
  }
}

function lintAtomicDesign() {
  LEVELS.forEach((level) => {
    const dir = path.join(UI_ROOT, level);
    if (!fs.existsSync(dir)) return;
    walk(dir, (file) => {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        checkImports(file, level);
      }
    });
  });
  if (ERRORS.length === 0) {
    console.log('✅ Atomic design lint: No violations found.');
  } else {
    console.error('❌ Atomic design violations:');
    ERRORS.forEach((e) => console.error('  -', e));
    process.exit(1);
  }
}

if (require.main === module) {
  lintAtomicDesign();
}
