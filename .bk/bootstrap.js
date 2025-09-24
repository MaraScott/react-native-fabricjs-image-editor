(function () {
    'use strict';

    const JSON_PROPS = ['metadata', 'excludeFromExport'];

    const defaultButtons = [
        'select',
        'draw',
        'textbox',
        'background',
        'undo',
        'redo',
        'save',
        'clear',
        'images',
        'fullscreen',
        'templates',
        'frames'
    ];

    const defaultShapes = [];
    const defaultImages = [];
    const defaultTemplates = [];
    const defaultFonts = [];

    const defaultOptions = {
        buttons: defaultButtons,
        shapes: defaultShapes,
        images: defaultImages,
        templates: defaultTemplates,
        fonts: defaultFonts,
        dimensions: {
            width: 1360,
            height: 768
        },
        canvasSizeBlock: true,
        fixedCanvas: true,
        layers: true
    };

    const state = {
        editor: null,
        ready: false,
        queue: [],
        canvasListeners: [],
        lastDesign: null,
        currentOptions: defaultOptions
    };

    function waitForElm(selector, timeout = 8000) {
        return new Promise((resolve, reject) => {
            const immediate = document.querySelector(selector);
            if (immediate) return resolve(immediate);

            const root = document.querySelector('#image-editor-container') || document.body;
            const obs = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) {
                    obs.disconnect();
                    resolve(el);
                }
            });

            obs.observe(root, { childList: true, subtree: true });

            if (timeout) {
                setTimeout(() => {
                    obs.disconnect();
                    reject(new Error(`Timeout waiting for ${selector}`));
                }, timeout);
            }
        });
    }

    function debounce(fn, wait = 250) {
        let timeout;
        return function debounced() {
            clearTimeout(timeout);
            const args = arguments;
            timeout = setTimeout(() => fn.apply(null, args), wait);
        };
    }

    function toJSONString(value) {
        if (value == null) return value;
        return typeof value === 'string' ? value : JSON.stringify(value);
    }

    function postMessage(type, payload) {
        const message = JSON.stringify({ type, payload });
        if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
            window.ReactNativeWebView.postMessage(message);
        } else if (window.parent && window.parent !== window && typeof window.parent.postMessage === 'function') {
            window.parent.postMessage(message, '*');
        } else {
            console.log('[Editor]', type, payload);
        }
    }

    function removeCanvasListeners() {
        if (!state.editor || !state.editor.canvas || !state.canvasListeners.length) return;
        state.canvasListeners.forEach(({ event, handler }) => {
            try {
                state.editor.canvas.off(event, handler);
            } catch (error) {
                console.warn('Unable to detach canvas listener', event, error);
            }
        });
        state.canvasListeners = [];
    }

    function destroyEditor() {
        removeCanvasListeners();
        if (state.editor && typeof state.editor.destroy === 'function') {
            try {
                state.editor.destroy();
            } catch (error) {
                console.warn('Unable to destroy editor cleanly', error);
            }
        }
        state.editor = null;
        state.ready = false;
    }

    const notifyChange = debounce(() => {
        if (!state.editor || !state.editor.canvas) return;
        try {
            const json = JSON.stringify(state.editor.canvas.toJSON(JSON_PROPS));
            state.lastDesign = json;
            postMessage('change', { json });
        } catch (error) {
            postMessage('error', { message: error.message, phase: 'serialize-change' });
        }
    }, 300);

    function attachCanvasListeners(editor) {
        if (!editor || !editor.canvas) return;
        const canvas = editor.canvas;
        const events = [
            'object:added',
            'object:modified',
            'object:removed',
            'object:skewing',
            'object:scaling',
            'object:rotated',
            'path:created',
            'text:changed',
            'selection:cleared',
            'canvas:cleared'
        ];

        events.forEach((event) => {
            const handler = notifyChange;
            canvas.on(event, handler);
            state.canvasListeners.push({ event, handler });
        });

        if (canvas.fire) {
            const historyEvents = ['history:undo', 'history:redo'];
            historyEvents.forEach((event) => {
                const handler = notifyChange;
                canvas.on(event, handler);
                state.canvasListeners.push({ event, handler });
            });
        }
    }

    function wrapMethod(instance, methodName, wrapper) {
        if (!instance || typeof instance[methodName] !== 'function') return;
        const original = instance[methodName].bind(instance);
        instance[methodName] = function wrapped() {
            wrapper.apply(instance, arguments);
            return original.apply(instance, arguments);
        };
    }

    function wrapEditorExports(editor) {
        wrapMethod(editor, 'saveToBrowser', function () {
            try {
                const json = JSON.stringify(editor.canvas.toJSON(JSON_PROPS));
                postMessage('save', { json });
            } catch (error) {
                postMessage('error', { message: error.message, phase: 'save' });
            }
        });

        wrapMethod(editor, 'downloadImage', function (data, extension) {
            postMessage('export', {
                format: extension || 'png',
                dataUrl: data
            });
        });

        wrapMethod(editor, 'downloadSVG', function (markup) {
            postMessage('export', {
                format: 'svg',
                svg: markup
            });
        });

        wrapMethod(editor, 'downloadJSON', function (json) {
            postMessage('export', {
                format: 'json',
                json: toJSONString(json)
            });
        });
    }

    function autoActivateDrawTool() {
        waitForElm('#image-editor-container #draw')
            .then((btn) => {
                if (!btn.disabled) btn.click();
                postMessage('log', { message: 'Draw tool activated' });
            })
            .catch(() => {
                /* ignore */
            });
    }

    function mergeOptions(partial) {
        if (!partial) return { ...defaultOptions };
        const merged = {
            ...defaultOptions,
            ...partial,
            dimensions: {
                ...defaultOptions.dimensions,
                ...(partial.dimensions || {})
            }
        };

        if (Array.isArray(partial.buttons)) merged.buttons = partial.buttons;
        if (Array.isArray(partial.shapes)) merged.shapes = partial.shapes;
        if (Array.isArray(partial.images)) merged.images = partial.images;
        if (Array.isArray(partial.templates)) merged.templates = partial.templates;
        if (Array.isArray(partial.fonts)) merged.fonts = partial.fonts;

        return merged;
    }

    function initializeEditor(options, initialJson) {
        const mergedOptions = mergeOptions(options);
        state.currentOptions = mergedOptions;

        const startEditor = () => {
            destroyEditor();
            try {
                state.editor = new ImageEditor('#image-editor-container', mergedOptions);
                wrapEditorExports(state.editor);
                attachCanvasListeners(state.editor);
                autoActivateDrawTool();
                state.ready = true;
                postMessage('ready', { options: mergedOptions });
                if (initialJson) {
                    applyCanvasJSON(initialJson);
                } else if (state.lastDesign) {
                    // keep the previous state after reconfiguration
                    applyCanvasJSON(state.lastDesign);
                }
                flushQueue();
            } catch (error) {
                console.error('Failed to initialize image editor', error);
                postMessage('error', { message: error.message, phase: 'init' });
            }
        };

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(startEditor).catch(startEditor);
        } else {
            startEditor();
        }
    }

    function applyCanvasJSON(json) {
        if (!state.editor || !state.editor.setCanvasJSON || !json) return;
        try {
            state.editor.setCanvasJSON(json);
            state.lastDesign = json;
            notifyChange();
        } catch (error) {
            postMessage('error', { message: error.message, phase: 'apply-json' });
        }
    }

    function handleExportRequest(payload) {
        if (!state.editor || !state.editor.canvas) return;
        const format = (payload && payload.format ? payload.format : 'json').toLowerCase();

        try {
            if (format === 'json') {
                const json = JSON.stringify(state.editor.canvas.toJSON(JSON_PROPS));
                postMessage('export', { format: 'json', json });
                return;
            }

            if (format === 'svg') {
                const svg = state.editor.canvas.toSVG({ suppressPreamble: true });
                postMessage('export', { format: 'svg', svg });
                return;
            }

            const dataUrl = state.editor.canvas.toDataURL({
                format: format === 'jpg' ? 'jpeg' : format
            });
            postMessage('export', { format, dataUrl });
        } catch (error) {
            postMessage('error', { message: error.message, phase: 'request-export' });
        }
    }

    function handleMessage(message) {
        if (!message || typeof message !== 'object') return;
        const { type, payload } = message;

        if (type === 'configure') {
            initializeEditor(payload && payload.options, payload && payload.initialJson);
            return;
        }

        if (!state.ready || !state.editor) {
            state.queue.push(message);
            return;
        }

        switch (type) {
            case 'set-design':
                if (payload && payload.json) {
                    applyCanvasJSON(payload.json);
                }
                break;
            case 'request-json':
                notifyChange();
                break;
            case 'request-export':
                handleExportRequest(payload || {});
                break;
            case 'focus-tool':
                if (payload && payload.tool && state.editor && typeof state.editor.setActiveTool === 'function') {
                    try {
                        state.editor.setActiveTool(payload.tool, { forceOpen: true });
                    } catch (error) {
                        postMessage('error', { message: error.message, phase: 'focus-tool' });
                    }
                }
                break;
            case 'undo':
                if (state.editor && typeof state.editor.undo === 'function') {
                    try {
                        state.editor.undo();
                    } catch (error) {
                        postMessage('error', { message: error.message, phase: 'undo' });
                    }
                }
                break;
            case 'redo':
                if (state.editor && typeof state.editor.redo === 'function') {
                    try {
                        state.editor.redo();
                    } catch (error) {
                        postMessage('error', { message: error.message, phase: 'redo' });
                    }
                }
                break;
            default:
                postMessage('log', { message: `Unhandled message type: ${type}` });
                break;
        }
    }

    function flushQueue() {
        if (!state.ready || !state.editor || !state.queue.length) return;
        const pending = [...state.queue];
        state.queue = [];
        pending.forEach(handleMessage);
    }

    function parseMessage(event) {
        if (!event || typeof event.data !== 'string') return null;
        try {
            return JSON.parse(event.data);
        } catch (error) {
            postMessage('error', { message: error.message, phase: 'parse-message' });
            return null;
        }
    }

    function handleNativeEvent(event) {
        const message = parseMessage(event);
        if (!message) return;
        handleMessage(message);
    }

    const bootstrap = window.__FABRIC_EDITOR_BOOTSTRAP__ || {};
    initializeEditor(bootstrap.options, bootstrap.initialJson);

    document.addEventListener('message', handleNativeEvent);
    window.addEventListener('message', handleNativeEvent);
})();
