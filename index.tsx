import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import FilerobotEditorApp from './components/FilerobotEditorApp';
import './styles.css';

declare global {
  interface Window {
    __FILEROBOT_EDITOR_READY__?: boolean;
  }
}

const container = document.getElementById('image-editor-root');

if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <FilerobotEditorApp />
    </StrictMode>,
  );
  window.__FILEROBOT_EDITOR_READY__ = true;
}
