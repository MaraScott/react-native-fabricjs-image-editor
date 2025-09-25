const globalScope: any = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : {};

const konvaGlobal = globalScope.Konva;

if (!konvaGlobal) {
  console.warn('[fabric-editor] Konva global not found. Make sure konva.min.js is loaded before the editor bundle.');
}

export default konvaGlobal;
