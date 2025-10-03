import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TamaguiProvider, Theme } from 'tamagui';
import { tamaguiConfig } from '@config/tamagui';
import EditorApp from '@components/EditorApp';
import type { EditorDocument, EditorOptions, EditorTheme } from '@types/editor';
import { createEmptyDesign, parseDesign } from '@utils/design';
import { applyThemeToBody, resolveInitialTheme } from '@utils/theme';
import '@tamagui/tamagui.css';
import './styles.css';

const DEFAULT_OPTIONS: EditorOptions = {
  width: 1024,
  height: 1024,
  backgroundColor: '#ffffff',
  showGrid: false,
  gridSize: 32,
  snapToGrid: false,
  snapToGuides: false,
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

function resolveInitialThemeName(): EditorTheme {
  return resolveInitialTheme();
}

const container = document.getElementById('image-editor-root');

const initialTheme = resolveInitialThemeName();
applyThemeToBody(initialTheme);

const rootThemeName = initialTheme === 'kid' ? 'gold' : 'sapphire';

if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <Theme name={rootThemeName} key={`theme-${rootThemeName}`}>
          <EditorApp
            initialDesign={resolveInitialDesign()}
            initialOptions={resolveInitialOptions()}
            initialTheme={initialTheme}
            backgroundColor="#eeeeee"
          />
        </Theme>
      </TamaguiProvider>
    </StrictMode>,
  );
}
