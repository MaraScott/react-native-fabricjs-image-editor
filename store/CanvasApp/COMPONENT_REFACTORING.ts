/**
 * Store Refactoring Notes
 *
 * A snapshot of the original migration from component-managed tool state to the
 * Redux store. The summary intentionally remains in prose form so future
 * maintainers can see what changed without digging through history.
 *
 * ## Key changes
 * - CanvasApp now reads tool state via `useSelector` and updates it with
 *   `viewActions` dispatched through `useDispatch`.
 * - The legacy `view.tsx` file was removed once the modular `view/` directory
 *   shipped, eliminating conflicting default exports.
 * - All store imports were normalized to relative paths so the editor can be
 *   embedded in environments without path alias support.
 *
 * ## Developer tips
 * - If TypeScript yells after checking out this refactor, restart the TS server
 *   so it drops the cached file graph.
 * - Search for `useState.*Tool` if you need to ensure other components no longer
 *   manage tool flags locally.
 *
 * ## Benefits
 /**
  * place - Auto-generated documentation stub.
  *
  * @returns {Redux} Result produced by place.
  */
 * - Tool state lives in a single predictable place (Redux).
 * - Redux DevTools can replay tool changes for debugging.
 * - Unit tests can exercise reducers without rendering components.
 */

export const REFACTORING_NOTES = {
  status: 'complete',
  filesModified: 3,
  componentsRefactored: 1,
  needsTsRestart: true,
};
