import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';

export const TABS = {
  ADJUST: 'adjust',
  ANNOTATE: 'annotate',
  FILTERS: 'filters',
  RESIZE: 'resize',
  FINETUNE: 'finetune',
  WATERMARK: 'watermark',
} as const;

export const TOOLS = {
  CROP: 'crop',
  ROTATE: 'rotate',
  FLIP_HORIZONTAL: 'flip-horizontal',
  FLIP_VERTICAL: 'flip-vertical',
  BRIGHTNESS: 'brightness',
  CONTRAST: 'contrast',
  SATURATION: 'saturation',
  TEXT: 'text',
  RESET: 'reset',
} as const;

export type TabId = (typeof TABS)[keyof typeof TABS];
export type ToolId = (typeof TOOLS)[keyof typeof TOOLS];

export type CropRect = { x: number; y: number; width: number; height: number };

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  fontFamily: string;
  opacity: number;
  fontWeight: string;
}

export interface EditorDesignState {
  crop: CropRect | null;
  rotation: number;
  flip: { horizontal: boolean; vertical: boolean };
  adjustments: { brightness: number; contrast: number; saturation: number };
  texts: TextOverlay[];
}

export interface SavePayload {
  editedImage: string;
  designState: EditorDesignState;
}

export interface FilerobotImageEditorProps {
  source: string | null;
  onSave?: (payload: SavePayload) => void;
  onClose?: () => void;
  theme?: 'dark' | 'light';
  annotationsCommon?: { fill?: string; stroke?: string; fontSize?: number };
  Text?: { text?: string; color?: string; fontSize?: number; fontFamily?: string };
  Rotate?: { angle?: number };
  Crop?: { aspectRatio?: number | string };
  config?: { initialTab?: TabId; disableDownload?: boolean };
  previewPixelRatio?: number;
}

interface PointerPosition {
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function createDefaultTextOverlay(id: string, defaults?: FilerobotImageEditorProps['annotationsCommon'] & FilerobotImageEditorProps['Text']) {
  return {
    id,
    text: defaults?.text ?? 'Double click to edit',
    x: 32,
    y: 32,
    color: defaults?.color ?? defaults?.fill ?? '#f8fafc',
    fontSize: defaults?.fontSize ?? 36,
    fontFamily: defaults?.fontFamily ?? 'Inter, sans-serif',
    opacity: 1,
    fontWeight: '600',
  } satisfies TextOverlay;
}

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const TOOL_LABEL: Record<ToolId, string> = {
  [TOOLS.CROP]: 'Crop',
  [TOOLS.ROTATE]: 'Rotate',
  [TOOLS.FLIP_HORIZONTAL]: 'Flip Horizontal',
  [TOOLS.FLIP_VERTICAL]: 'Flip Vertical',
  [TOOLS.BRIGHTNESS]: 'Brightness',
  [TOOLS.CONTRAST]: 'Contrast',
  [TOOLS.SATURATION]: 'Saturation',
  [TOOLS.TEXT]: 'Text',
  [TOOLS.RESET]: 'Reset',
};

const TAB_LABEL: Record<TabId, string> = {
  [TABS.ADJUST]: 'Adjust',
  [TABS.ANNOTATE]: 'Annotate',
  [TABS.FILTERS]: 'Filters',
  [TABS.FINETUNE]: 'Finetune',
  [TABS.RESIZE]: 'Resize',
  [TABS.WATERMARK]: 'Watermark',
};

function useImage(source: string | null) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!source) {
      setImage(null);
      setError(null);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const handleLoad = () => {
      if (cancelled) return;
      setImage(img);
      setError(null);
    };

    const handleError = () => {
      if (cancelled) return;
      setImage(null);
      setError('Failed to load image');
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);
    img.src = source;

    return () => {
      cancelled = true;
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [source]);

  return { image, error } as const;
}

function renderImageToCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  options: {
    rotation: number;
    flipHorizontal: boolean;
    flipVertical: boolean;
    brightness: number;
    contrast: number;
    saturation: number;
    texts: TextOverlay[];
  },
) {
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  const { rotation, flipHorizontal, flipVertical, brightness, contrast, saturation, texts } = options;

  const width = image.width;
  const height = image.height;

  canvas.width = width;
  canvas.height = height;

  context.save();
  context.clearRect(0, 0, width, height);
  context.translate(width / 2, height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);
  context.filter = `brightness(${1 + brightness}) contrast(${1 + contrast}) saturate(${1 + saturation})`;
  context.drawImage(image, -width / 2, -height / 2, width, height);
  context.restore();

  for (const overlay of texts) {
    if (!overlay.text) continue;
    context.save();
    context.globalAlpha = clamp(overlay.opacity, 0, 1);
    context.fillStyle = overlay.color;
    context.font = `${overlay.fontWeight} ${Math.max(8, overlay.fontSize)}px ${overlay.fontFamily}`;
    context.textBaseline = 'top';
    context.fillText(overlay.text, overlay.x, overlay.y);
    context.restore();
  }
}

function pointerEventToCanvasPosition(
  event: ReactPointerEvent<HTMLDivElement>,
  container: HTMLDivElement,
  image: HTMLImageElement,
): PointerPosition | null {
  const bounds = container.getBoundingClientRect();
  const relativeX = event.clientX - bounds.left;
  const relativeY = event.clientY - bounds.top;
  if (relativeX < 0 || relativeY < 0 || relativeX > bounds.width || relativeY > bounds.height) {
    return null;
  }
  const scaleX = image.width / bounds.width;
  const scaleY = image.height / bounds.height;
  return {
    x: clamp(relativeX * scaleX, 0, image.width),
    y: clamp(relativeY * scaleY, 0, image.height),
  };
}

export default function FilerobotImageEditor({
  source,
  onSave,
  onClose,
  theme = 'dark',
  annotationsCommon,
  Text,
  Rotate,
  Crop,
  config,
}: FilerobotImageEditorProps) {
  const { image, error } = useImage(source);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cropStartRef = useRef<PointerPosition | null>(null);
  const pointerDownRef = useRef(false);

  const [activeTab, setActiveTab] = useState<TabId>(config?.initialTab ?? TABS.ADJUST);
  const [activeTool, setActiveTool] = useState<ToolId>(TOOLS.CROP);
  const [rotation, setRotation] = useState(() => clamp(Rotate?.angle ?? 0, -180, 180));
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [isCropping, setIsCropping] = useState(true);
  const [texts, setTexts] = useState<TextOverlay[]>(() => {
    if (!Text?.text) {
      return [];
    }
    return [createDefaultTextOverlay(`text-${Date.now()}`, { ...annotationsCommon, ...Text })];
  });
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  const canvasOptions = useMemo(
    () => ({ rotation, flipHorizontal, flipVertical, brightness, contrast, saturation, texts }),
    [rotation, flipHorizontal, flipVertical, brightness, contrast, saturation, texts],
  );

  useEffect(() => {
    if (!image || !canvasRef.current) {
      return;
    }
    renderImageToCanvas(canvasRef.current, image, canvasOptions);
  }, [image, canvasOptions]);

  useEffect(() => {
    setIsCropping(activeTool === TOOLS.CROP);
  }, [activeTool]);

  const idPrefix = useId();

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isCropping || !containerRef.current || !image) {
        return;
      }
      const position = pointerEventToCanvasPosition(event, containerRef.current, image);
      if (!position) {
        return;
      }
      pointerDownRef.current = true;
      cropStartRef.current = position;
      setCropRect({ x: position.x, y: position.y, width: 0, height: 0 });
    },
    [image, isCropping],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!pointerDownRef.current || !containerRef.current || !image || !cropStartRef.current) {
        return;
      }
      const position = pointerEventToCanvasPosition(event, containerRef.current, image);
      if (!position) {
        return;
      }
      const start = cropStartRef.current;
      const x = Math.min(start.x, position.x);
      const y = Math.min(start.y, position.y);
      const width = Math.abs(position.x - start.x);
      const height = Math.abs(position.y - start.y);
      setCropRect({ x, y, width, height });
    },
    [image],
  );

  const handlePointerUp = useCallback(() => {
    pointerDownRef.current = false;
    cropStartRef.current = null;
  }, []);

  const handleRotateLeft = useCallback(() => {
    setRotation((current) => ((current - 90 + 360) % 360) - 180);
  }, []);

  const handleRotateRight = useCallback(() => {
    setRotation((current) => ((current + 90 + 360) % 360) - 180);
  }, []);

  const handleFlipHorizontal = useCallback(() => {
    setFlipHorizontal((value) => !value);
  }, []);

  const handleFlipVertical = useCallback(() => {
    setFlipVertical((value) => !value);
  }, []);

  const handleReset = useCallback(() => {
    setRotation(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setCropRect(null);
    setTexts([]);
    setSelectedTextId(null);
  }, []);

  const handleAddText = useCallback(() => {
    const id = `${idPrefix}-${Date.now()}`;
    const overlay = createDefaultTextOverlay(id, { ...annotationsCommon, ...Text });
    setTexts((items) => [...items, overlay]);
    setSelectedTextId(id);
  }, [annotationsCommon, Text, idPrefix]);

  const handleUpdateText = useCallback((id: string, patch: Partial<TextOverlay>) => {
    setTexts((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const handleRemoveText = useCallback((id: string) => {
    setTexts((items) => items.filter((item) => item.id !== id));
    setSelectedTextId((value) => (value === id ? null : value));
  }, []);

  const handleSave = useCallback(() => {
    if (!image) {
      return;
    }

    const stagingCanvas = document.createElement('canvas');
    const outputCanvas = document.createElement('canvas');
    const stagingContext = stagingCanvas.getContext('2d');
    const outputContext = outputCanvas.getContext('2d');

    if (!stagingContext || !outputContext) {
      return;
    }

    renderImageToCanvas(stagingCanvas, image, canvasOptions);

    const crop = cropRect && cropRect.width > 1 && cropRect.height > 1
      ? cropRect
      : { x: 0, y: 0, width: image.width, height: image.height };

    outputCanvas.width = crop.width;
    outputCanvas.height = crop.height;
    outputContext.drawImage(
      stagingCanvas,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height,
    );

    const dataUrl = outputCanvas.toDataURL('image/png');

    const payload: SavePayload = {
      editedImage: dataUrl,
      designState: {
        crop: cropRect && cropRect.width > 1 && cropRect.height > 1 ? cropRect : null,
        rotation,
        flip: { horizontal: flipHorizontal, vertical: flipVertical },
        adjustments: { brightness, contrast, saturation },
        texts,
      },
    };

    onSave?.(payload);
  }, [image, canvasOptions, cropRect, rotation, flipHorizontal, flipVertical, brightness, contrast, saturation, texts, onSave]);

  const handleAspectRatio = useCallback(
    (ratio: number | null) => {
      if (!image) {
        return;
      }
      if (ratio === null) {
        setCropRect({ x: 0, y: 0, width: image.width, height: image.height });
        return;
      }
      if (!cropRect) {
        return;
      }
      const desiredRatio = ratio;
      const widthFromHeight = cropRect.height * desiredRatio;
      const heightFromWidth = cropRect.width / desiredRatio;

      if (widthFromHeight <= image.width) {
        const width = widthFromHeight;
        const x = clamp(cropRect.x, 0, image.width - width);
        setCropRect({ ...cropRect, x, width });
      } else {
        const height = heightFromWidth;
        const y = clamp(cropRect.y, 0, image.height - height);
        setCropRect({ ...cropRect, y, height });
      }
    },
    [cropRect, image],
  );

  const canvasWrapperStyle = useMemo<CSSProperties>(() => {
    return {
      '--fie-theme': theme,
    } as CSSProperties;
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const globalRef = window as typeof window & {
      FilerobotImageEditor?: {
        default: typeof FilerobotImageEditor;
        TABS: typeof TABS;
        TOOLS: typeof TOOLS;
      };
    };
    globalRef.FilerobotImageEditor = {
      default: FilerobotImageEditor,
      TABS,
      TOOLS,
    };
  }, []);

  const aspectRatioOptions = useMemo(() => {
    const baseOptions = [
      { label: 'Original', value: null },
      { label: '1:1', value: 1 },
      { label: '4:3', value: 4 / 3 },
      { label: '3:4', value: 3 / 4 },
      { label: '16:9', value: 16 / 9 },
      { label: '9:16', value: 9 / 16 },
    ];
    if (!Crop?.aspectRatio || Crop.aspectRatio === 'free') {
      return baseOptions;
    }
    const ratio = typeof Crop.aspectRatio === 'string' ? Crop.aspectRatio : `${Crop.aspectRatio}`;
    if (!baseOptions.some((option) => `${option.value ?? 'free'}` === ratio)) {
      baseOptions.push({ label: `${ratio}`, value: typeof Crop.aspectRatio === 'number' ? Crop.aspectRatio : null });
    }
    return baseOptions;
  }, [Crop?.aspectRatio]);

  const activeAspectRatio = useMemo(() => {
    if (!cropRect || !cropRect.width || !cropRect.height) {
      return null;
    }
    const ratio = cropRect.width / cropRect.height;
    const option = aspectRatioOptions.find((item) => {
      if (!item.value) {
        return false;
      }
      return Math.abs(item.value - ratio) < 0.02;
    });
    return option?.value ?? null;
  }, [aspectRatioOptions, cropRect]);

  return (
    <div className={`fie-root fie-theme-${theme}`}>
      <header className="fie-header">
        <div className="fie-header-left">
          <strong className="fie-title">Filerobot Image Editor</strong>
          {source ? <span className="fie-subtitle">Resolution: {image ? `${image.width} × ${image.height}` : 'loading…'}</span> : null}
          {error ? <span className="fie-error">{error}</span> : null}
        </div>
        <div className="fie-header-actions">
          <button type="button" className="fie-button" onClick={handleSave} disabled={!image}>
            Save
          </button>
          {!config?.disableDownload && image ? (
            <button
              type="button"
              className="fie-button secondary"
              onClick={() => {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (!context) return;
                renderImageToCanvas(canvas, image, canvasOptions);
                const dataUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = 'edited-image.png';
                link.click();
              }}
            >
              Download PNG
            </button>
          ) : null}
          {onClose ? (
            <button type="button" className="fie-button ghost" onClick={onClose}>
              Close
            </button>
          ) : null}
        </div>
      </header>

      <div className="fie-toolbar">
        <div className="fie-tab-bar" role="tablist" aria-label="Image editor tabs">
          {Object.values(TABS).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              className={`fie-chip ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {TAB_LABEL[tab]}
            </button>
          ))}
        </div>

        <div className="fie-tool-bar" role="toolbar" aria-label="Image editor tools">
          <button
            type="button"
            className={`fie-chip ${activeTool === TOOLS.CROP ? 'active' : ''}`}
            onClick={() => setActiveTool(TOOLS.CROP)}
          >
            {TOOL_LABEL[TOOLS.CROP]}
          </button>
          <button type="button" className="fie-chip" onClick={handleRotateLeft}>
            Rotate -90°
          </button>
          <button type="button" className="fie-chip" onClick={handleRotateRight}>
            Rotate +90°
          </button>
          <button
            type="button"
            className={`fie-chip ${flipHorizontal ? 'active' : ''}`}
            onClick={handleFlipHorizontal}
          >
            {TOOL_LABEL[TOOLS.FLIP_HORIZONTAL]}
          </button>
          <button
            type="button"
            className={`fie-chip ${flipVertical ? 'active' : ''}`}
            onClick={handleFlipVertical}
          >
            {TOOL_LABEL[TOOLS.FLIP_VERTICAL]}
          </button>
          <button type="button" className="fie-chip danger" onClick={handleReset}>
            {TOOL_LABEL[TOOLS.RESET]}
          </button>
        </div>
      </div>

      <main className="fie-main">
        <div
          className={`fie-canvas-wrapper ${!image ? 'empty' : ''}`}
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerUp}
          onPointerUp={handlePointerUp}
          style={canvasWrapperStyle}
        >
          {image ? (
            <Fragment>
              <canvas ref={canvasRef} className="fie-canvas" aria-label="Image preview" />
              {cropRect ? (
                <div
                  className="fie-crop-area"
                  style={{
                    left: formatPercent(cropRect.x / image.width),
                    top: formatPercent(cropRect.y / image.height),
                    width: formatPercent(cropRect.width / image.width),
                    height: formatPercent(cropRect.height / image.height),
                  }}
                />
              ) : null}
            </Fragment>
          ) : (
            <div className="fie-empty-state">Select an image to start editing.</div>
          )}
        </div>

        <aside className="fie-control-panel">
          <section className="fie-control-group" aria-labelledby={`${idPrefix}-adjustments`}>
            <h2 id={`${idPrefix}-adjustments`}>Adjustments</h2>
            <label className="fie-slider-label" htmlFor={`${idPrefix}-brightness`}>
              Brightness
            </label>
            <input
              id={`${idPrefix}-brightness`}
              type="range"
              min={-1}
              max={1}
              step={0.02}
              value={brightness}
              onChange={(event) => setBrightness(Number(event.currentTarget.value))}
            />
            <label className="fie-slider-label" htmlFor={`${idPrefix}-contrast`}>
              Contrast
            </label>
            <input
              id={`${idPrefix}-contrast`}
              type="range"
              min={-1}
              max={1}
              step={0.02}
              value={contrast}
              onChange={(event) => setContrast(Number(event.currentTarget.value))}
            />
            <label className="fie-slider-label" htmlFor={`${idPrefix}-saturation`}>
              Saturation
            </label>
            <input
              id={`${idPrefix}-saturation`}
              type="range"
              min={-1}
              max={1}
              step={0.02}
              value={saturation}
              onChange={(event) => setSaturation(Number(event.currentTarget.value))}
            />
          </section>

          <section className="fie-control-group" aria-labelledby={`${idPrefix}-crop`}>
            <h2 id={`${idPrefix}-crop`}>Crop settings</h2>
            <div className="fie-chip-group">
              {aspectRatioOptions.map((option) => (
                <button
                  key={`${option.label}-${option.value ?? 'free'}`}
                  type="button"
                  className={`fie-chip ${option.value === activeAspectRatio ? 'active' : ''}`}
                  onClick={() => handleAspectRatio(option.value ?? null)}
                  disabled={!cropRect}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button type="button" className="fie-button ghost" onClick={() => setCropRect(null)} disabled={!cropRect}>
              Clear crop
            </button>
          </section>

          <section className="fie-control-group" aria-labelledby={`${idPrefix}-text`}>
            <div className="fie-control-header">
              <h2 id={`${idPrefix}-text`}>Text overlays</h2>
              <button type="button" className="fie-button secondary" onClick={handleAddText}>
                Add text
              </button>
            </div>
            {texts.length === 0 ? <p className="fie-hint">No text overlays yet.</p> : null}
            <div className="fie-text-grid">
              {texts.map((overlay) => {
                const isSelected = selectedTextId === overlay.id;
                return (
                  <article key={overlay.id} className={`fie-text-card ${isSelected ? 'selected' : ''}`}>
                    <header className="fie-text-card-header">
                      <button
                        type="button"
                        className="fie-chip"
                        onClick={() => setSelectedTextId(overlay.id)}
                      >
                        {overlay.text || 'Text'}
                      </button>
                      <button
                        type="button"
                        className="fie-button ghost"
                        onClick={() => handleRemoveText(overlay.id)}
                      >
                        Remove
                      </button>
                    </header>
                    <label>
                      Content
                      <input
                        type="text"
                        value={overlay.text}
                        onChange={(event) => handleUpdateText(overlay.id, { text: event.currentTarget.value })}
                      />
                    </label>
                    <label>
                      Colour
                      <input
                        type="color"
                        value={overlay.color}
                        onChange={(event) => handleUpdateText(overlay.id, { color: event.currentTarget.value })}
                      />
                    </label>
                    <label>
                      Font size
                      <input
                        type="number"
                        min={8}
                        max={200}
                        value={Math.round(overlay.fontSize)}
                        onChange={(event) => handleUpdateText(overlay.id, { fontSize: Number(event.currentTarget.value) })}
                      />
                    </label>
                    <label>
                      Opacity
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={overlay.opacity}
                        onChange={(event) => handleUpdateText(overlay.id, { opacity: Number(event.currentTarget.value) })}
                      />
                    </label>
                    <div className="fie-row">
                      <label>
                        X
                        <input
                          type="number"
                          value={Math.round(overlay.x)}
                          onChange={(event) =>
                            handleUpdateText(overlay.id, {
                              x: clamp(Number(event.currentTarget.value), 0, image ? image.width : Number.POSITIVE_INFINITY),
                            })
                          }
                        />
                      </label>
                      <label>
                        Y
                        <input
                          type="number"
                          value={Math.round(overlay.y)}
                          onChange={(event) =>
                            handleUpdateText(overlay.id, {
                              y: clamp(Number(event.currentTarget.value), 0, image ? image.height : Number.POSITIVE_INFINITY),
                            })
                          }
                        />
                      </label>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
