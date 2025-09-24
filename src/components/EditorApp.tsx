import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layer, Stage } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Stage as StageType } from 'konva/lib/Stage';
import PropertiesPanel from './PropertiesPanel';
import { CircleNode, ImageNode, RectNode, TextNode } from './KonvaNodes';
import { useHistory } from '../hooks/useHistory';
import type {
  CircleElement,
  EditorDesign,
  EditorElement,
  EditorOptions,
  ImageElement,
  RectElement,
  TextElement,
} from '../types/editor';
import { parseDesign, stringifyDesign } from '../utils/design';

const DEFAULT_OPTIONS: EditorOptions = {
  width: 960,
  height: 540,
  backgroundColor: '#ffffff',
  showGrid: true,
};

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createRect(options: EditorOptions): RectElement {
  return {
    id: createId('rect'),
    type: 'rect',
    name: 'Rectangle',
    x: options.width / 2 - 80,
    y: options.height / 2 - 60,
    width: 160,
    height: 120,
    fill: '#38bdf8',
    stroke: '#0f172a',
    strokeWidth: 4,
    cornerRadius: 16,
    rotation: 0,
    opacity: 1,
    draggable: true,
  };
}

function createCircle(options: EditorOptions): CircleElement {
  return {
    id: createId('circle'),
    type: 'circle',
    name: 'Circle',
    x: options.width / 2,
    y: options.height / 2,
    radius: 80,
    fill: '#a855f7',
    stroke: '#0f172a',
    strokeWidth: 4,
    rotation: 0,
    opacity: 0.95,
    draggable: true,
  };
}

function createText(options: EditorOptions): TextElement {
  return {
    id: createId('text'),
    type: 'text',
    name: 'Text',
    x: options.width / 2 - 150,
    y: options.height / 2 - 20,
    text: 'Edit me!',
    fontSize: 32,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fill: '#0f172a',
    width: 300,
    align: 'center',
    rotation: 0,
    opacity: 1,
    draggable: true,
  };
}

function createImage(options: EditorOptions, src: string): ImageElement {
  return {
    id: createId('image'),
    type: 'image',
    name: 'Image',
    x: options.width / 2 - 160,
    y: options.height / 2 - 120,
    width: 320,
    height: 240,
    src,
    rotation: 0,
    opacity: 1,
    draggable: true,
  };
}

interface EditorAppProps {
  initialDesign?: EditorDesign | null;
  initialOptions?: Partial<EditorOptions>;
}

function getInitialOptions(options?: Partial<EditorOptions>): EditorOptions {
  return { ...DEFAULT_OPTIONS, ...(options ?? {}) };
}

interface BridgeMessage {
  type: string;
  payload?: any;
}

function parseBridgeMessage(raw: unknown): BridgeMessage | null {
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.type === 'string') {
        return parsed as BridgeMessage;
      }
    } catch (error) {
      console.warn('[Editor] Unable to parse message', error);
    }
    return null;
  }

  if (raw && typeof raw === 'object' && typeof (raw as any).type === 'string') {
    return raw as BridgeMessage;
  }

  return null;
}

function useBridge() {
  const postMessage = useCallback((type: string, payload?: unknown) => {
    const message = JSON.stringify({ type, payload });
    if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
      window.ReactNativeWebView.postMessage(message);
    }
    if (window.parent && window.parent !== window && typeof window.parent.postMessage === 'function') {
      window.parent.postMessage(message, '*');
    }
  }, []);

  return { postMessage };
}

export default function EditorApp({ initialDesign, initialOptions }: EditorAppProps) {
  const [options, setOptions] = useState<EditorOptions>(getInitialOptions(initialOptions));
  const stageRef = useRef<StageType | null>(null);

  const design = useMemo(() => initialDesign ?? { elements: [], metadata: null }, [initialDesign]);
  const { value: elements, set: setElements, reset: resetElements, undo, redo, canUndo, canRedo } =
    useHistory<EditorElement[]>(design.elements ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { postMessage } = useBridge();

  const selectedElement = useMemo(
    () => elements.find((element: EditorElement) => element.id === selectedId) ?? null,
    [elements, selectedId],
  );

  const updateElement = useCallback(
      (id: string, attributes: Partial<EditorElement>) => {
        setElements(
          elements.map((element: EditorElement) =>
            element.id === id ? ({ ...element, ...attributes } as EditorElement) : element,
          ),
        );
      },
      [elements, setElements],
    );

  const removeElement = useCallback(() => {
    if (!selectedId) return;
    setElements(elements.filter((element: EditorElement) => element.id !== selectedId));
    setSelectedId(null);
  }, [elements, selectedId, setElements]);

  const handleAddRect = useCallback(() => {
    const node = createRect(options);
    setElements([...elements, node]);
    setSelectedId(node.id);
  }, [elements, options, setElements]);

  const handleAddCircle = useCallback(() => {
    const node = createCircle(options);
    setElements([...elements, node]);
    setSelectedId(node.id);
  }, [elements, options, setElements]);

  const handleAddText = useCallback(() => {
    const node = createText(options);
    setElements([...elements, node]);
    setSelectedId(node.id);
  }, [elements, options, setElements]);

  const handleAddImage = useCallback(() => {
    const url = window.prompt('Enter image URL');
    if (!url) return;
    const node = createImage(options, url);
    setElements([...elements, node]);
    setSelectedId(node.id);
  }, [elements, options, setElements]);

  const handleClear = useCallback(() => {
    setElements([]);
    setSelectedId(null);
  }, [setElements]);

  const handleSave = useCallback(() => {
    postMessage('save', { json: stringifyDesign(elements) });
  }, [elements, postMessage]);

  const handleExport = useCallback(
    (format: 'png' | 'jpeg' | 'json') => {
      if (format === 'json') {
        postMessage('export', { format: 'json', json: stringifyDesign(elements) });
        return;
      }
      const stage = stageRef.current;
      if (!stage) return;
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const dataUrl = stage.toDataURL({ mimeType, quality: format === 'jpeg' ? 0.92 : undefined });
      postMessage('export', { format, dataUrl });
    },
    [elements, postMessage],
  );

  const handleStagePointerDown = useCallback(
    (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = event.target.getStage();
      if (!stage) return;
      if (event.target === stage) {
        setSelectedId(null);
      }
    },
    [],
  );

  useEffect(() => {
    postMessage('ready', { options });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const serialized = stringifyDesign(elements);
    const handle = window.setTimeout(() => {
      postMessage('change', { json: serialized });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [elements, postMessage]);

  useEffect(() => {
    postMessage('options', { options });
  }, [options, postMessage]);

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const message = parseBridgeMessage(event.data);
      if (!message) return;

      switch (message.type) {
        case 'setDesign':
        case 'loadDesign': {
          const designValue = message.payload?.json ?? message.payload ?? null;
          const parsed = parseDesign(designValue);
          if (parsed) {
            resetElements(parsed.elements ?? []);
            setSelectedId(null);
          }
          break;
        }
        case 'setOptions': {
          const incoming = message.payload?.options ?? message.payload ?? {};
          setOptions((current) => ({ ...current, ...incoming }));
          break;
        }
        case 'undo':
          undo();
          break;
        case 'redo':
          redo();
          break;
        case 'clear':
          handleClear();
          break;
        case 'requestExport': {
          const format = (message.payload?.format as 'png' | 'jpeg' | 'json') ?? 'png';
          handleExport(format);
          break;
        }
        case 'requestJSON':
        case 'requestCanvasJSON': {
          postMessage('change', { json: stringifyDesign(elements) });
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('message', listener);
    document.addEventListener('message', listener as any);
    return () => {
      window.removeEventListener('message', listener);
      document.removeEventListener('message', listener as any);
    };
  }, [elements, handleClear, handleExport, postMessage, redo, resetElements, undo]);

  const gridBackground = useMemo(() => {
    if (!options.showGrid) {
      return {
        backgroundColor: options.backgroundColor,
      };
    }
    return {
      backgroundColor: options.backgroundColor,
      backgroundImage:
        'linear-gradient(rgba(15, 23, 42, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.08) 1px, transparent 1px)',
      backgroundSize: '32px 32px',
    } as const;
  }, [options.backgroundColor, options.showGrid]);

  return (
    <div className="editor-shell">
      <div className="editor-toolbar">
        <button type="button" onClick={handleAddRect}>
          Rectangle
        </button>
        <button type="button" onClick={handleAddCircle}>
          Circle
        </button>
        <button type="button" onClick={handleAddText}>
          Text
        </button>
        <button type="button" onClick={handleAddImage}>
          Image
        </button>
        <span className="toolbar-spacer" aria-hidden="true" />
        <button type="button" onClick={undo} disabled={!canUndo}>
          Undo
        </button>
        <button type="button" onClick={redo} disabled={!canRedo}>
          Redo
        </button>
        <button type="button" onClick={handleClear} disabled={elements.length === 0}>
          Clear
        </button>
        <button type="button" onClick={handleSave} disabled={elements.length === 0}>
          Save
        </button>
        <button type="button" onClick={() => handleExport('png')} disabled={elements.length === 0}>
          Export PNG
        </button>
      </div>

      <div className="editor-layout">
        <div className="editor-canvas">
          <div className="stage-wrapper" style={{ width: options.width, height: options.height, ...gridBackground }}>
            <Stage
              ref={stageRef}
              width={options.width}
              height={options.height}
              onMouseDown={handleStagePointerDown}
              onTouchStart={handleStagePointerDown}
            >
              <Layer>
                {elements.map((element: EditorElement) => {
                  switch (element.type) {
                    case 'rect':
                      return (
                        <RectNode
                          key={element.id}
                          shape={element}
                          isSelected={selectedId === element.id}
                          onSelect={() => setSelectedId(element.id)}
                          onChange={(attrs: Partial<EditorElement>) => updateElement(element.id, attrs)}
                        />
                      );
                    case 'circle':
                      return (
                        <CircleNode
                          key={element.id}
                          shape={element}
                          isSelected={selectedId === element.id}
                          onSelect={() => setSelectedId(element.id)}
                          onChange={(attrs: Partial<EditorElement>) => updateElement(element.id, attrs)}
                        />
                      );
                    case 'text':
                      return (
                        <TextNode
                          key={element.id}
                          shape={element}
                          isSelected={selectedId === element.id}
                          onSelect={() => setSelectedId(element.id)}
                          onChange={(attrs: Partial<EditorElement>) => updateElement(element.id, attrs)}
                        />
                      );
                    case 'image':
                      return (
                        <ImageNode
                          key={element.id}
                          shape={element}
                          isSelected={selectedId === element.id}
                          onSelect={() => setSelectedId(element.id)}
                          onChange={(attrs: Partial<EditorElement>) => updateElement(element.id, attrs)}
                        />
                      );
                    default:
                      return null;
                  }
                })}
              </Layer>
            </Stage>
          </div>
        </div>

        <aside className="editor-sidebar">
          <h2>Canvas</h2>
          <div className="canvas-stats">
            <span>
              {options.width} × {options.height} px
            </span>
            <span>{elements.length} layers</span>
          </div>
          <div className="properties-grid">
            <label>
              Width
              <input
                type="number"
                min={100}
                value={Math.round(options.width)}
                onChange={(event) =>
                  setOptions((current) => {
                    const value = Number(event.target.value);
                    return {
                      ...current,
                      width: Number.isFinite(value) ? Math.max(100, value) : current.width,
                    };
                  })
                }
              />
            </label>
            <label>
              Height
              <input
                type="number"
                min={100}
                value={Math.round(options.height)}
                onChange={(event) =>
                  setOptions((current) => {
                    const value = Number(event.target.value);
                    return {
                      ...current,
                      height: Number.isFinite(value) ? Math.max(100, value) : current.height,
                    };
                  })
                }
              />
            </label>
            <label className="full-width">
              Background
              <input
                type="color"
                value={options.backgroundColor}
                onChange={(event) => setOptions((current) => ({ ...current, backgroundColor: event.target.value }))}
              />
            </label>
            <label>
              <span>Show grid</span>
              <input
                type="checkbox"
                checked={options.showGrid}
                onChange={(event) => setOptions((current) => ({ ...current, showGrid: event.target.checked }))}
              />
            </label>
          </div>

          <h2>Selection</h2>
          {selectedElement ? (
            <PropertiesPanel
              element={selectedElement}
              onChange={(attributes) => updateElement(selectedElement.id, attributes)}
              onRemove={removeElement}
            />
          ) : (
            <p className="empty-selection">Select an element to reveal editable settings.</p>
          )}

          <h2>Export</h2>
          <div className="export-panel">
            <button type="button" onClick={() => handleExport('png')} disabled={elements.length === 0}>
              Download PNG
            </button>
            <button type="button" onClick={() => handleExport('jpeg')} disabled={elements.length === 0}>
              Download JPEG
            </button>
            <button type="button" onClick={() => handleExport('json')} disabled={elements.length === 0}>
              Download JSON
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
