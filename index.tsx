/**
 * Simple Canvas Entry Point
 * Uses Atomic Design Pattern with Konva
 * React/React Native compatible
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CanvasApp } from '@pages/Canvas';

// Get configuration from bootstrap (if available)
const bootstrap = (window as any).__EDITOR_BOOTSTRAP__ || {};
const width = bootstrap.width || 800;
const height = bootstrap.height || 600;
const backgroundColor = bootstrap.backgroundColor || '#ffffff';

// Mount the application
const container = document.getElementById('image-editor-root');

if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <CanvasApp
        width={width}
        height={height}
        backgroundColor={backgroundColor}
      />
    </StrictMode>
  );
}
