import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TamaguiProvider, Theme } from 'tamagui';
import { appConfig } from './src-codex/tamagui.config';
import EditorShell from './src-codex/components/EditorShell';
import './styles.css';

const container = document.getElementById('image-editor-root');

if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <TamaguiProvider config={appConfig} defaultTheme="adult">
        <Theme name="adult">
          <EditorShell />
        </Theme>
      </TamaguiProvider>
    </StrictMode>,
  );
}
