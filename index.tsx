import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TamaguiProvider, Theme } from 'tamagui';
import { tamaguiConfig } from '../../../../tamagui.config';
import EditorApp from './components/EditorApp';
import type { EditorDocument, EditorOptions } from './types/editor';
import { createEmptyDesign, parseDesign } from './utils/design';
import '../../tamagui/tamagui.css';
import './styles.css';

const DEFAULT_OPTIONS: EditorOptions = {
  width: 1024,
  height: 1024,
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
  root.render(
    <StrictMode>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <Theme name="gold" key="theme-gold">
          <EditorApp initialDesign={resolveInitialDesign()} initialOptions={resolveInitialOptions()} />
        </Theme>
      </TamaguiProvider>
    </StrictMode>,
  );
}
