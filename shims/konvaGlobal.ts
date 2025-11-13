const globalScope: any = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : {};

const konvaGlobal = globalScope.Konva;

/**
 * if - Auto-generated summary; refine if additional context is needed.
 *
 * @returns {!konvaGlobal} Refer to the implementation for the precise returned value.
 */
/**
 * if - Auto-generated documentation stub.
 *
 * @returns {!konvaGlobal} Result produced by if.
 */
if (!konvaGlobal) {
  /**
   * warn - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {'[fabric-editor] Konva global not found. Make sure konva.min.js is loaded before the editor bundle.'} Refer to the implementation for the precise returned value.
   */
  /**
   * warn - Auto-generated documentation stub.
   *
   * @returns {'[fabric-editor] Konva global not found. Make sure konva.min.js is loaded before the editor bundle.'} Result produced by warn.
   */
  console.warn('[fabric-editor] Konva global not found. Make sure konva.min.js is loaded before the editor bundle.');
}

export default konvaGlobal;
