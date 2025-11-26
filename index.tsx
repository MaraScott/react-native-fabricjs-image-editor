/**
 * Simple Canvas Entry Point
 * Uses Atomic Design Pattern with Konva
 * React/React Native compatible
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from "@utils/ErrorBoundary";
import { Provider } from 'react-redux'
import { CanvasApp as CanvasAppStore } from '@store/CanvasApp';
import { CanvasApp } from '@pages/Canvas';

/**
 * Host-provided bootstrap configuration that allows the embedding surface to
 * control canvas dimensions and styling. Falls back to safe defaults when the
 * host does not expose any overrides.
 */
const bootstrap = (window as any).__EDITOR_BOOTSTRAP__ || {};
const width = bootstrap.width ?? 1024;
const height = bootstrap.height ?? 1024;
const backgroundColor = bootstrap.backgroundColor ?? '#cccccc33';
const theme = bootstrap.theme ?? 'kid';
const i18n = bootstrap.i18n ?? 'fr';
const assets_path = bootstrap.assets_path ?? './assets/public';

const bootstrapConfig = {
    width,
    height,
    backgroundColor,
    theme,
    i18n,
    assets_path,
};
CanvasAppStore.dispatch({ type: 'configuration/bootstrap', payload: bootstrapConfig });

// Mount the application
/**
 * getElementById - Auto-generated documentation stub.
 *
 * @returns {'image-editor-root'} Result produced by getElementById.
 */
const container = document.getElementById('image-editor-root');

/**
 * if - Auto-generated documentation stub.
 *
 * @returns {container} Result produced by if.
 */
if (container) {
    /**
     * createRoot - Auto-generated documentation stub.
     *
     * @returns {container} Result produced by createRoot.
     */
    const root = createRoot(container);
    root.render(
        <StrictMode>
            <ErrorBoundary fallback="Error">
                <Provider store={CanvasAppStore}>
                    <CanvasApp id={`tae`} />
                </Provider>
            </ErrorBoundary>
        </StrictMode>
    );
}
