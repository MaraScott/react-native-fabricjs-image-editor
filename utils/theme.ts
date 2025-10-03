import type { EditorTheme } from '../types/editor';

export const THEME_STORAGE_KEY = 'tinyartist-editor-theme';

export function getStoredTheme(): EditorTheme | null {
    if (typeof window === 'undefined') {
        return null;
    }
    try {
        const stored = window.localStorage?.getItem(THEME_STORAGE_KEY);
        return stored === 'kid' || stored === 'adult' ? stored : null;
    } catch {
        return null;
    }
}

export function getBootstrapTheme(): EditorTheme | null {
    if (typeof window === 'undefined') {
        return null;
    }
    const theme = window.__EDITOR_BOOTSTRAP__?.theme;
    return theme === 'kid' || theme === 'adult' ? theme : null;
}

export function resolveInitialTheme(): EditorTheme {
    return getStoredTheme() ?? getBootstrapTheme() ?? 'kid';
}

export function persistTheme(theme: EditorTheme): void {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        window.localStorage?.setItem(THEME_STORAGE_KEY, theme);
    } catch {
        // Ignore persistence failures (private browsing, etc.)
    }
}

export function applyThemeToBody(theme: EditorTheme): () => void {
    if (typeof document === 'undefined') {
        return () => {};
    }
    const target = document.body;
    if (!target) {
        return () => {};
    }
    target.dataset.editorTheme = theme;
    return () => {
        if (target.dataset.editorTheme === theme) {
            delete target.dataset.editorTheme;
        }
    };
}
