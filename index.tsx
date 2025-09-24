import { createRoot } from 'react-dom/client';
import EditorApp from './components/EditorApp';
import type { EditorDocument, EditorOptions } from './types/editor';
import { createEmptyDesign, parseDesign } from './utils/design';
import './styles.css';

const DEFAULT_OPTIONS: EditorOptions = {
  width: 960,
  height: 540,
  backgroundColor: '#ffffff',
  showGrid: true,
  gridSize: 32,
  snapToGrid: true,
  snapToGuides: true,
  showGuides: true,
  showRulers: false,
  zoom: 1,
  fixedCanvas: false,
  canvasSizeLocked: false,
};

function resolveInitialDesign(): EditorDocument {
  const bootstrap = window.__EDITOR_BOOTSTRAP__;
  if (!bootstrap || !bootstrap.initialDesign) {
    return createEmptyDesign();
  }
  return parseDesign(bootstrap.initialDesign) ?? createEmptyDesign();
}

function resolveInitialOptions(): EditorOptions {
  const bootstrap = window.__EDITOR_BOOTSTRAP__;
  return { ...DEFAULT_OPTIONS, ...(bootstrap?.options ?? {}) };
}

const container = document.getElementById('image-editor-root');

if (container) {
  const root = createRoot(container);
  root.render(<EditorApp initialDesign={resolveInitialDesign()} initialOptions={resolveInitialOptions()} />);
}
