import { forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Button,
  Card,
  Checkbox,
  H2,
  Input,
  Paragraph,
  ScrollView,
  Separator,
  Slider,
  Text,
  Theme,
  XStack,
  YStack,
} from 'tamagui';
import { Layer as KonvaLayer, Line, Rect, Stage, Text as KonvaText, Transformer } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Vector2d } from 'konva/lib/types';
import { v4 as uuid } from 'uuid';
import { Image as KonvaImage } from 'react-konva';

// Local type helpers -------------------------------------------------------

type ToolType =
  | 'select'
  | 'brush'
  | 'eraser'
  | 'text'
  | 'image';

type ThemeVariant = 'kid' | 'adult' | 'midnight';

type BaseElement = {
  id: string;
  layerId: string;
  name: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  visible: boolean;
  draggable: boolean;
};

type BackgroundElement = BaseElement & {
  type: 'background';
  fill: string;
  width: number;
  height: number;
};

type BrushElement = BaseElement & {
  type: 'brush';
  stroke: string;
  strokeWidth: number;
  points: number[];
  tension: number;
};

type TextElement = BaseElement & {
  type: 'text';
  text: string;
  fill: string;
  fontSize: number;
  width: number;
};

type ImageElement = BaseElement & {
  type: 'image';
  src: string;
  width: number;
  height: number;
};

type EditorElement = BackgroundElement | BrushElement | TextElement | ImageElement;

type EditorLayer = {
  id: string;
  name: string;
  elementIds: string[];
  visible: boolean;
  locked: boolean;
  isBackground?: boolean;
};

type EditorDesign = {
  width: number;
  height: number;
  backgroundColor: string;
  layers: EditorLayer[];
  elements: Record<string, EditorElement>;
};

type HistoryState = {
  past: EditorDesign[];
  future: EditorDesign[];
};

type BrushSettings = {
  color: string;
  size: number;
  tension: number;
};

type TextSettings = {
  color: string;
  fontSize: number;
  content: string;
};

type ImageSettings = {
  fitToCanvas: boolean;
};

type ToolSettings = {
  brush: BrushSettings;
  text: TextSettings;
  image: ImageSettings;
};

type SaveStatus =
  | { state: 'idle' }
  | { state: 'saving' }
  | { state: 'success'; message: string }
  | { state: 'error'; message: string };

const CANVAS_DEFAULT_SIZE = 1024;
const HISTORY_LIMIT = 50;
const ZOOM_MIN = -100;
const ZOOM_MAX = 100;
const POINTER_TOLERANCE = 8;
const DOUBLE_TAP_DELAY = 320;

// Utility hooks -----------------------------------------------------------

function useCanvasImage(src: string | null) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      setImage(null);
      return undefined;
    }
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.src = src;
    const handleLoad = () => setImage(img);
    const handleError = () => setImage(null);
    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);
    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [src]);

  return image;
}

function cloneDesign(design: EditorDesign): EditorDesign {
  return {
    ...design,
    layers: design.layers.map((layer) => ({ ...layer, elementIds: [...layer.elementIds] })),
    elements: Object.fromEntries(
      Object.entries(design.elements).map(([key, value]) => [key, { ...value } as EditorElement]),
    ),
  };
}

function createInitialDesign(): EditorDesign {
  const backgroundId = 'background';
  const backgroundElement: BackgroundElement = {
    id: backgroundId,
    type: 'background',
    layerId: backgroundId,
    name: 'Background',
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    visible: true,
    draggable: false,
    fill: '#ffffff',
    width: CANVAS_DEFAULT_SIZE,
    height: CANVAS_DEFAULT_SIZE,
  };

  const backgroundLayer: EditorLayer = {
    id: backgroundId,
    name: 'Background',
    elementIds: [backgroundElement.id],
    visible: true,
    locked: true,
    isBackground: true,
  };

  const primaryLayer: EditorLayer = {
    id: 'layer-1',
    name: 'Layer 1',
    elementIds: [],
    visible: true,
    locked: false,
  };

  return {
    width: CANVAS_DEFAULT_SIZE,
    height: CANVAS_DEFAULT_SIZE,
    backgroundColor: '#ffffff',
    layers: [backgroundLayer, primaryLayer],
    elements: {
      [backgroundElement.id]: backgroundElement,
    },
  };
}

function createInitialToolSettings(): ToolSettings {
  return {
    brush: {
      color: '#2563eb',
      size: 6,
      tension: 0.5,
    },
    text: {
      color: '#111827',
      fontSize: 36,
      content: 'Type here',
    },
    image: {
      fitToCanvas: false,
    },
  };
}

// Component ----------------------------------------------------------------

export default function EditorShell(): JSX.Element {
  const [design, setDesign] = useState<EditorDesign>(() => createInitialDesign());
  const [tool, setTool] = useState<ToolType>('select');
  const [activeTheme, setActiveTheme] = useState<ThemeVariant>('adult');
  const [toolSettings, setToolSettings] = useState<ToolSettings>(() => createInitialToolSettings());
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeLayerId, setActiveLayerId] = useState<string>('layer-1');
  const [zoomPercent, setZoomPercent] = useState<number>(0);
  const [stagePosition, setStagePosition] = useState<Vector2d>({ x: 0, y: 0 });
  const [workspaceSize, setWorkspaceSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [pendingPan, setPendingPan] = useState(false);
  const [history, setHistory] = useState<HistoryState>({ past: [], future: [] });
  const [clipboard, setClipboard] = useState<EditorElement | null>(null);
  const [wordpressEndpoint, setWordpressEndpoint] = useState('https://example.com/wp-json/editor/v1/save');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ state: 'idle' });

  const workspaceRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const drawingIdRef = useRef<string | null>(null);
  const lastTapRef = useRef<number>(0);

  const activeLayer = useMemo(
    () => design.layers.find((layer) => layer.id === activeLayerId) ?? design.layers[1],
    [design.layers, activeLayerId],
  );

  const stageScale = useMemo(() => {
    const baseScale = Math.min(
      workspaceSize.width / design.width || 1,
      workspaceSize.height / design.height || 1,
    );
    const zoomFactor = 1 + zoomPercent / 100;
    return Math.max(0.05, baseScale * zoomFactor);
  }, [workspaceSize, design.width, design.height, zoomPercent]);

  const designElements = design.elements;

  const sortedLayers = useMemo(() => design.layers, [design.layers]);

  const selectedElement = selectedElementId ? designElements[selectedElementId] ?? null : null;

  const commitDesign = useCallback(
    (updater: (prev: EditorDesign) => EditorDesign) => {
      setDesign((prev) => {
        const next = updater(prev);
        if (next === prev) return prev;
        setHistory((current) => {
          const past = [...current.past, cloneDesign(prev)];
          if (past.length > HISTORY_LIMIT) {
            past.shift();
          }
          return { past, future: [] };
        });
        return next;
      });
    },
    [],
  );

  const updateElement = useCallback(
    (elementId: string, mutator: (element: EditorElement) => EditorElement, options: { recordHistory?: boolean } = {}) => {
      const { recordHistory = true } = options;
      if (recordHistory) {
        commitDesign((prev) => {
          if (!prev.elements[elementId]) return prev;
          const next = cloneDesign(prev);
          next.elements[elementId] = mutator({ ...prev.elements[elementId] });
          return next;
        });
      } else {
        setDesign((prev) => {
          if (!prev.elements[elementId]) return prev;
          const next = cloneDesign(prev);
          next.elements[elementId] = mutator({ ...prev.elements[elementId] });
          return next;
        });
      }
    },
    [commitDesign, setDesign],
  );

  const addElementToLayer = useCallback(
    (layerId: string, element: EditorElement) => {
      commitDesign((prev) => {
        const layerIndex = prev.layers.findIndex((layer) => layer.id === layerId);
        if (layerIndex === -1) return prev;
        const next = cloneDesign(prev);
        next.elements[element.id] = element;
        next.layers[layerIndex] = {
          ...next.layers[layerIndex],
          elementIds: [...next.layers[layerIndex].elementIds, element.id],
        };
        return next;
      });
      setSelectedElementId(element.id);
    },
    [commitDesign],
  );

  const removeElement = useCallback(
    (elementId: string) => {
      commitDesign((prev) => {
        if (!prev.elements[elementId]) return prev;
        const next = cloneDesign(prev);
        const element = prev.elements[elementId];
        delete next.elements[elementId];
        next.layers = next.layers.map((layer) => ({
          ...layer,
          elementIds: layer.elementIds.filter((id) => id !== elementId),
        }));
        if (elementId === selectedElementId) {
          setSelectedElementId(null);
        }
        return next;
      });
    },
    [commitDesign, selectedElementId],
  );

  const handleUndo = useCallback(() => {
    setHistory((current) => {
      if (current.past.length === 0) return current;
      const past = [...current.past];
      const previous = past.pop()!;
      setDesign(previous);
      return { past, future: [cloneDesign(design), ...current.future] };
    });
  }, [design]);

  const handleRedo = useCallback(() => {
    setHistory((current) => {
      if (current.future.length === 0) return current;
      const [next, ...rest] = current.future;
      setDesign(next);
      return { past: [...current.past, cloneDesign(design)], future: rest };
    });
  }, [design]);

  const handleClear = useCallback(() => {
    commitDesign((prev) => {
      const next = cloneDesign(prev);
      next.layers = next.layers.map((layer) =>
        layer.isBackground
          ? layer
          : {
              ...layer,
              elementIds: [],
            },
      );
      next.elements = Object.fromEntries(
        Object.entries(next.elements).filter(([key, element]) => element.type === 'background'),
      );
      setSelectedElementId(null);
      return next;
    });
  }, [commitDesign]);

  const handleCopy = useCallback(() => {
    if (!selectedElement) return;
    setClipboard({ ...selectedElement, id: `copy-${selectedElement.id}` } as EditorElement);
  }, [selectedElement]);

  const handlePaste = useCallback(() => {
    if (!clipboard) return;
    const newId = uuid();
    const layerId = clipboard.layerId ?? activeLayerId;
    const copy: EditorElement = {
      ...clipboard,
      id: newId,
      name: `${clipboard.name} Copy`,
      x: clipboard.x + 20,
      y: clipboard.y + 20,
      layerId,
    } as EditorElement;
    addElementToLayer(layerId, copy);
  }, [clipboard, addElementToLayer, activeLayerId]);

  const getCanvasCoordinates = useCallback(
    (stage: any, pointerPosition?: Vector2d | null): Vector2d | null => {
      if (!stage) return null;
      const pointer = pointerPosition ?? stage.getPointerPosition();
      if (!pointer) return null;
      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      return transform.point(pointer);
    },
    [],
  );

  const handlePointerDown = useCallback(
    (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;
      const now = Date.now();
      const pointer = getCanvasCoordinates(stage, stage.getPointerPosition());
      if (!pointer) return;

      const isTouchGesture =
        'touches' in event.evt && Array.isArray((event.evt as TouchEvent).touches)
          ? (event.evt as TouchEvent).touches.length >= 2
          : false;

      if (isSpacePressed || isTouchGesture) {
        setPendingPan(true);
        return;
      }

      const tapDelta = now - lastTapRef.current;
      if (tapDelta < DOUBLE_TAP_DELAY && tool === 'select') {
        setPendingPan(true);
        return;
      }
      lastTapRef.current = now;

      if (tool === 'select') {
        const target = event.target as any;
        const elementId = target?.attrs?.name;
        if (elementId && designElements[elementId]) {
          setSelectedElementId(elementId);
        } else {
          setSelectedElementId(null);
        }
        return;
      }

      if (tool === 'brush') {
        const newId = uuid();
        drawingIdRef.current = newId;
        const settings = toolSettings.brush;
        const element: BrushElement = {
          id: newId,
          type: 'brush',
          layerId: activeLayerId,
          name: 'Drawing',
          x: 0,
          y: 0,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          visible: true,
          draggable: false,
          stroke: settings.color,
          strokeWidth: settings.size,
          points: [pointer.x, pointer.y],
          tension: settings.tension,
        };
        addElementToLayer(activeLayerId, element);
        return;
      }

      if (tool === 'eraser') {
        const hits = stage.getAllIntersections(stage.getPointerPosition());
        const target = hits.find((node: any) => node?.attrs?.name && node.attrs.name !== 'background');
        if (target?.attrs?.name) {
          removeElement(target.attrs.name as string);
        }
        return;
      }

      if (tool === 'text') {
        const settings = toolSettings.text;
        const element: TextElement = {
          id: uuid(),
          type: 'text',
          layerId: activeLayerId,
          name: 'Text',
          x: pointer.x,
          y: pointer.y,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          visible: true,
          draggable: false,
          fill: settings.color,
          fontSize: settings.fontSize,
          text: settings.content,
          width: Math.min(360, design.width - pointer.x),
        };
        addElementToLayer(activeLayerId, element);
        return;
      }
    },
    [
      getCanvasCoordinates,
      tool,
      designElements,
      toolSettings.brush,
      toolSettings.text,
      activeLayerId,
      addElementToLayer,
      removeElement,
      design.width,
      isSpacePressed,
    ],
  );

  const handlePointerMove = useCallback(
    (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (tool === 'brush') {
        const currentId = drawingIdRef.current;
        if (!currentId) return;
        const stage = stageRef.current;
        if (!stage) return;
        const pointer = getCanvasCoordinates(stage, stage.getPointerPosition());
        if (!pointer) return;
        updateElement(
          currentId,
          (element) => {
            if (element.type !== 'brush') return element;
            return { ...element, points: [...element.points, pointer.x, pointer.y] };
          },
          { recordHistory: false },
        );
      }
      if (pendingPan && stageRef.current) {
        stageRef.current.container().style.cursor = 'grabbing';
        const stage = stageRef.current;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const last = (event.evt as any).lastPosition || pointer;
        const dx = pointer.x - last.x;
        const dy = pointer.y - last.y;
        setStagePosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        (event.evt as any).lastPosition = pointer;
      }
    },
    [getCanvasCoordinates, tool, pendingPan, updateElement],
  );

  const handlePointerUp = useCallback(() => {
    drawingIdRef.current = null;
    setPendingPan(false);
    if (stageRef.current) {
      stageRef.current.container().style.cursor = 'default';
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setIsSpacePressed(true);
      }
      if (event.metaKey || event.ctrlKey) {
        if (event.key === 'z') {
          event.preventDefault();
          handleUndo();
        }
        if (event.key === 'y') {
          event.preventDefault();
          handleRedo();
        }
        if (event.key === 'c') {
          event.preventDefault();
          handleCopy();
        }
        if (event.key === 'v') {
          event.preventDefault();
          handlePaste();
        }
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedElementId) {
          event.preventDefault();
          removeElement(selectedElementId);
        }
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleUndo, handleRedo, handleCopy, handlePaste, removeElement, selectedElementId]);

  useLayoutEffect(() => {
    const node = workspaceRef.current;
    if (!node) return undefined;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setWorkspaceSize({ width, height });
        if (width > 0 && height > 0) {
          setStagePosition({
            x: (width - design.width * stageScale) / 2,
            y: (height - design.height * stageScale) / 2,
          });
        }
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [design.width, design.height, stageScale]);

  useEffect(() => {
    if (!transformerRef.current) return;
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!stage) return;
    if (selectedElementId && designElements[selectedElementId]) {
      const selectedNode = stage.findOne(`.${selectedElementId}`);
      if (selectedNode) {
        transformer.nodes([selectedNode]);
        transformer.getLayer()?.batchDraw();
      }
    } else {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedElementId, designElements]);

  useEffect(() => {
    if (!stageRef.current) return;
    const container = stageRef.current.container();
    container.style.cursor = pendingPan || isSpacePressed ? 'grab' : 'default';
  }, [pendingPan, isSpacePressed]);

  const handleTransformEnd = useCallback(
    (event: KonvaEventObject<Event>) => {
      const node = event.target;
      const elementId = node?.attrs?.name;
      if (!elementId) return;
      updateElement(elementId, (element) => {
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const width = Math.max(5, node.width() * scaleX);
        const height = Math.max(5, node.height() * scaleY);
        node.scaleX(1);
        node.scaleY(1);
        if (element.type === 'text') {
          return {
            ...element,
            x: node.x(),
            y: node.y(),
            width,
            scaleX: 1,
            scaleY: 1,
          };
        }
        if (element.type === 'image' || element.type === 'background') {
          return {
            ...element,
            x: node.x(),
            y: node.y(),
            width,
            height,
            scaleX: 1,
            scaleY: 1,
          };
        }
        if (element.type === 'brush') {
          return {
            ...element,
            x: node.x(),
            y: node.y(),
            scaleX: 1,
            scaleY: 1,
          };
        }
        return element;
      });
    },
    [updateElement],
  );

  const backgroundElement = designElements['background'] as BackgroundElement;

  const handleBackgroundColorChange = (value: string) => {
    commitDesign((prev) => {
      const next = cloneDesign(prev);
      const background = next.elements['background'];
      if (background && background.type === 'background') {
        next.backgroundColor = value;
        (background as BackgroundElement).fill = value;
      }
      return next;
    });
  };

  const handleUploadImage = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const element: ImageElement = {
          id: uuid(),
          type: 'image',
          layerId: activeLayerId,
          name: file.name || 'Image',
          x: 0,
          y: 0,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          visible: true,
          draggable: false,
          src: dataUrl,
          width: toolSettings.image.fitToCanvas ? design.width : Math.min(512, design.width),
          height: toolSettings.image.fitToCanvas ? design.height : Math.min(512, design.height),
        };
        addElementToLayer(activeLayerId, element);
      };
      reader.readAsDataURL(file);
    },
    [activeLayerId, addElementToLayer, design.height, design.width, toolSettings.image.fitToCanvas],
  );

  const handleStageWheel = useCallback(
    (event: KonvaEventObject<WheelEvent>) => {
      event.evt.preventDefault();
      const direction = event.evt.deltaY > 0 ? -1 : 1;
      setZoomPercent((prev) => {
        const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev + direction * 5));
        return next;
      });
    },
    [],
  );

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const renderToolSettings = () => {
    switch (tool) {
      case 'brush':
        return (
          <YStack gap="$3">
            <Text fontWeight="600">Brush colour</Text>
            <Input
              value={toolSettings.brush.color}
              onChangeText={(value) =>
                setToolSettings((prev) => ({
                  ...prev,
                  brush: { ...prev.brush, color: value },
                }))
              }
              onChange={(event) =>
                setToolSettings((prev) => ({
                  ...prev,
                  brush: { ...prev.brush, color: (event.target as HTMLInputElement).value },
                }))
              }
            />
            <Text fontWeight="600">Brush size</Text>
            <Slider
              value={[toolSettings.brush.size]}
              min={1}
              max={48}
              step={1}
              onValueChange={(values) =>
                setToolSettings((prev) => ({
                  ...prev,
                  brush: { ...prev.brush, size: values[0] ?? prev.brush.size },
                }))
              }
            />
            <Text fontWeight="600">Smoothness</Text>
            <Slider
              value={[toolSettings.brush.tension]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={(values) =>
                setToolSettings((prev) => ({
                  ...prev,
                  brush: { ...prev.brush, tension: values[0] ?? prev.brush.tension },
                }))
              }
            />
          </YStack>
        );
      case 'text':
        return (
          <YStack gap="$3">
            <Text fontWeight="600">Text</Text>
            <Input
              value={toolSettings.text.content}
              onChangeText={(value) =>
                setToolSettings((prev) => ({
                  ...prev,
                  text: { ...prev.text, content: value },
                }))
              }
              onChange={(event) =>
                setToolSettings((prev) => ({
                  ...prev,
                  text: { ...prev.text, content: (event.target as HTMLInputElement).value },
                }))
              }
            />
            <Text fontWeight="600">Colour</Text>
            <Input
              value={toolSettings.text.color}
              onChangeText={(value) =>
                setToolSettings((prev) => ({
                  ...prev,
                  text: { ...prev.text, color: value },
                }))
              }
              onChange={(event) =>
                setToolSettings((prev) => ({
                  ...prev,
                  text: { ...prev.text, color: (event.target as HTMLInputElement).value },
                }))
              }
            />
            <Text fontWeight="600">Font size</Text>
            <Slider
              value={[toolSettings.text.fontSize]}
              min={16}
              max={96}
              step={2}
              onValueChange={(values) =>
                setToolSettings((prev) => ({
                  ...prev,
                  text: { ...prev.text, fontSize: values[0] ?? prev.text.fontSize },
                }))
              }
            />
          </YStack>
        );
      case 'image':
        return (
          <YStack gap="$3">
            <Text fontWeight="600">Image placement</Text>
            <XStack alignItems="center" gap="$2">
              <Checkbox
                checked={toolSettings.image.fitToCanvas}
                onCheckedChange={(checked) =>
                  setToolSettings((prev) => ({
                    ...prev,
                    image: { ...prev.image, fitToCanvas: Boolean(checked) },
                  }))
                }
              />
              <Text>Fit uploaded image to canvas</Text>
            </XStack>
            <Separator />
            <UploadImageButton onUpload={handleUploadImage} />
          </YStack>
        );
      case 'eraser':
        return (
          <Paragraph>
            Tap items to remove them. Eraser ignores the background layer so little artists stay safe.
          </Paragraph>
        );
      case 'select':
      default:
        return (
          <YStack gap="$3">
            <Text fontWeight="600">Selection helpers</Text>
            <XStack gap="$2" flexWrap="wrap">
              <Button size="$2" disabled={!selectedElement} onPress={handleCopy}>
                Copy
              </Button>
              <Button size="$2" disabled={!clipboard} onPress={handlePaste}>
                Paste
              </Button>
              <Button
                size="$2"
                disabled={!selectedElement}
                onPress={() => selectedElementId && removeElement(selectedElementId)}
                backgroundColor="$color.red"
              >
                Delete
              </Button>
            </XStack>
            {selectedElement && selectedElement.type === 'text' && (
              <YStack gap="$2">
                <Text fontWeight="600">Edit text</Text>
                <Input
                  value={selectedElement.text}
                  onChangeText={(value) =>
                    updateElement(selectedElement.id, (element) =>
                      element.type === 'text' ? { ...element, text: value } : element,
                    )
                  }
                  onChange={(event) =>
                    updateElement(selectedElement.id, (element) =>
                      element.type === 'text'
                        ? { ...element, text: (event.target as HTMLInputElement).value }
                        : element,
                    )
                  }
                />
              </YStack>
            )}
          </YStack>
        );
    }
  };

  return (
    <Theme name={activeTheme} forceClassName>
      <XStack
        flex={1}
        height="100vh"
        backgroundColor="$background"
        color="$color"
        overflow="hidden"
      >
        <Sidebar tool={tool} setTool={setTool} canUndo={canUndo} canRedo={canRedo} onUndo={handleUndo} onRedo={handleRedo} />
        <SecondaryPanel>{renderToolSettings()}</SecondaryPanel>
        <YStack flex={1} padding="$4" gap="$4">
          <HeaderBar
            activeTheme={activeTheme}
            setActiveTheme={setActiveTheme}
            zoomPercent={zoomPercent}
            setZoomPercent={setZoomPercent}
            onClear={handleClear}
            onCopy={handleCopy}
            onPaste={handlePaste}
          />
          <XStack flex={1} gap="$4" overflow="hidden">
            <WorkspaceCard ref={workspaceRef}>
              <Stage
                ref={stageRef}
                width={workspaceSize.width}
                height={workspaceSize.height}
                scaleX={stageScale}
                scaleY={stageScale}
                x={stagePosition.x}
                y={stagePosition.y}
                onMouseDown={handlePointerDown}
                onTouchStart={handlePointerDown}
                onMouseMove={handlePointerMove}
                onTouchMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onTouchEnd={handlePointerUp}
                onWheel={handleStageWheel}
              >
                {sortedLayers.map((layer) => (
                  <KonvaLayer key={layer.id} visible={layer.visible} listening={!layer.locked}>
                    {layer.elementIds.map((elementId) => {
                      const element = designElements[elementId];
                      if (!element || !element.visible) return null;
                      switch (element.type) {
                        case 'background':
                          return (
                            <Rect
                              key={element.id}
                              name={element.id}
                              listening={false}
                              x={element.x}
                              y={element.y}
                              width={element.width}
                              height={element.height}
                              fill={element.fill}
                              cornerRadius={16}
                            />
                          );
                        case 'brush':
                          return (
                            <Line
                              key={element.id}
                              name={element.id}
                              className={element.id}
                              points={element.points}
                              stroke={element.stroke}
                              strokeWidth={element.strokeWidth}
                              tension={element.tension}
                              lineCap="round"
                              lineJoin="round"
                              draggable={tool === 'select'}
                              onDragEnd={(event) => {
                                const node = event.target;
                                updateElement(
                                  element.id,
                                  (current) => ({
                                    ...current,
                                    x: node.x(),
                                    y: node.y(),
                                  }),
                                  { recordHistory: true },
                                );
                              }}
                              onClick={() => setSelectedElementId(element.id)}
                              onTap={() => setSelectedElementId(element.id)}
                            />
                          );
                        case 'text':
                          return (
                            <KonvaText
                              key={element.id}
                              name={element.id}
                              className={element.id}
                              x={element.x}
                              y={element.y}
                              text={element.text}
                              fontSize={element.fontSize}
                              fill={element.fill}
                              width={element.width}
                              draggable={tool === 'select'}
                              onDragEnd={(event) => {
                                const node = event.target;
                                updateElement(
                                  element.id,
                                  (current) => ({
                                    ...current,
                                    x: node.x(),
                                    y: node.y(),
                                  }),
                                );
                              }}
                              onClick={() => setSelectedElementId(element.id)}
                              onTap={() => setSelectedElementId(element.id)}
                            />
                          );
                        case 'image':
                          return (
                            <CanvasImage
                              key={element.id}
                              element={element}
                              isSelectable={tool === 'select'}
                              onSelect={() => setSelectedElementId(element.id)}
                              onChange={(attrs) =>
                                updateElement(element.id, (current) => ({
                                  ...current,
                                  ...attrs,
                                }))
                              }
                            />
                          );
                        default:
                          return null;
                      }
                    })}
                  </KonvaLayer>
                ))}
                <Transformer ref={transformerRef} rotateEnabled resizeEnabled onTransformEnd={handleTransformEnd} />
              </Stage>
            </WorkspaceCard>
            <YStack width={280} gap="$3">
              <LayersPanel
                layers={design.layers}
                activeLayerId={activeLayerId}
                setActiveLayerId={setActiveLayerId}
                elements={design.elements}
                onToggleVisibility={(layerId) =>
                  commitDesign((prev) => {
                    const next = cloneDesign(prev);
                    next.layers = next.layers.map((layer) =>
                      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer,
                    );
                    return next;
                  })
                }
                onAddLayer={() =>
                  commitDesign((prev) => {
                    const next = cloneDesign(prev);
                    const newLayer: EditorLayer = {
                      id: uuid(),
                      name: `Layer ${prev.layers.length}`,
                      elementIds: [],
                      visible: true,
                      locked: false,
                    };
                    next.layers = [...next.layers, newLayer];
                    return next;
                  })
                }
                onRenameLayer={(layerId, name) =>
                  commitDesign((prev) => {
                    const next = cloneDesign(prev);
                    next.layers = next.layers.map((layer) =>
                      layer.id === layerId ? { ...layer, name } : layer,
                    );
                    return next;
                  })
                }
                onMoveLayer={(layerId, direction) =>
                  commitDesign((prev) => {
                    const next = cloneDesign(prev);
                    const index = next.layers.findIndex((layer) => layer.id === layerId);
                    if (index < 0 || index === 0) return prev;
                    const targetIndex = direction === 'up' ? index - 1 : index + 1;
                    if (targetIndex <= 0 || targetIndex >= next.layers.length) return prev;
                    const reordered = [...next.layers];
                    const [layer] = reordered.splice(index, 1);
                    reordered.splice(targetIndex, 0, layer);
                    next.layers = reordered;
                    return next;
                  })
                }
              />
              <Card padding="$3" backgroundColor="$muted" borderRadius="$lg">
                <H2 fontSize={18}>Background</H2>
                <Input
                  value={backgroundElement.fill}
                  onChangeText={handleBackgroundColorChange}
                  onChange={(event) => handleBackgroundColorChange((event.target as HTMLInputElement).value)}
                />
              </Card>
              <Card padding="$3" backgroundColor="$muted" borderRadius="$lg" gap="$3">
                <H2 fontSize={18}>Save to WordPress</H2>
                <Paragraph size="$2">
                  Provide a REST endpoint that accepts a POST body with a `dataUrl` field containing the canvas snapshot.
                </Paragraph>
                <Input
                  value={wordpressEndpoint}
                  onChangeText={setWordpressEndpoint}
                  onChange={(event) => setWordpressEndpoint((event.target as HTMLInputElement).value)}
                />
                <Button
                  onPress={async () => {
                    if (!stageRef.current) return;
                    setSaveStatus({ state: 'saving' });
                    try {
                      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
                      const response = await fetch(wordpressEndpoint, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ dataUrl, metadata: { width: design.width, height: design.height } }),
                      });
                      if (!response.ok) {
                        throw new Error(`Request failed with status ${response.status}`);
                      }
                      setSaveStatus({ state: 'success', message: 'Saved to WordPress successfully!' });
                    } catch (error) {
                      setSaveStatus({ state: 'error', message: (error as Error).message });
                    }
                  }}
                >
                  Save snapshot
                </Button>
                {saveStatus.state === 'saving' && <Paragraph>Saving...</Paragraph>}
                {saveStatus.state === 'success' && <Paragraph color="$color">{saveStatus.message}</Paragraph>}
                {saveStatus.state === 'error' && <Paragraph color="#dc2626">{saveStatus.message}</Paragraph>}
              </Card>
            </YStack>
          </XStack>
        </YStack>
      </XStack>
    </Theme>
  );
}

// Auxiliary UI components -------------------------------------------------

type SidebarProps = {
  tool: ToolType;
  setTool: (tool: ToolType) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

const toolDefinitions: { id: ToolType; label: string }[] = [
  { id: 'select', label: 'Select' },
  { id: 'brush', label: 'Draw' },
  { id: 'text', label: 'Text' },
  { id: 'image', label: 'Image' },
  { id: 'eraser', label: 'Erase' },
];

function Sidebar({ tool, setTool, canRedo, canUndo, onRedo, onUndo }: SidebarProps) {
  return (
    <YStack
      width={88}
      backgroundColor="$muted"
      padding="$3"
      gap="$3"
      borderRightWidth={1}
      borderColor="$color"
    >
      <H2 fontSize={16}>Tools</H2>
      <Separator />
      <YStack gap="$2">
        {toolDefinitions.map((definition) => (
          <Button
            key={definition.id}
            size="$3"
            backgroundColor={tool === definition.id ? '#38bdf8' : undefined}
            onPress={() => setTool(definition.id)}
          >
            {definition.label}
          </Button>
        ))}
      </YStack>
      <Separator marginVertical="$3" />
      <Text fontWeight="700">History</Text>
      <Button size="$2" disabled={!canUndo} onPress={onUndo}>
        Undo
      </Button>
      <Button size="$2" disabled={!canRedo} onPress={onRedo}>
        Redo
      </Button>
    </YStack>
  );
}

function SecondaryPanel({ children }: { children: ReactNode }) {
  return (
    <YStack width={240} padding="$4" backgroundColor="$background" borderRightWidth={1} borderColor="$color">
      <ScrollView>{children}</ScrollView>
    </YStack>
  );
}

const WorkspaceCard = forwardRef<HTMLDivElement, React.ComponentProps<typeof YStack>>((props, ref) => (
  <YStack
    ref={ref}
    flex={1}
    backgroundColor="#111827"
    borderRadius="$lg"
    overflow="hidden"
    alignItems="center"
    justifyContent="center"
    {...props}
  />
));

const LayersPanel = ({
  layers,
  elements,
  activeLayerId,
  setActiveLayerId,
  onToggleVisibility,
  onAddLayer,
  onRenameLayer,
  onMoveLayer,
}: {
  layers: EditorLayer[];
  elements: Record<string, EditorElement>;
  activeLayerId: string;
  setActiveLayerId: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onAddLayer: () => void;
  onRenameLayer: (layerId: string, name: string) => void;
  onMoveLayer: (layerId: string, direction: 'up' | 'down') => void;
}) => (
  <Card padding="$3" backgroundColor="$muted" borderRadius="$lg" gap="$3">
    <XStack alignItems="center" justifyContent="space-between">
      <H2 fontSize={18}>Layers</H2>
      <Button size="$2" onPress={onAddLayer}>
        +
      </Button>
    </XStack>
    <ScrollView height={260} backgroundColor="#ffffff10" borderRadius="$md" padding="$2">
      <YStack gap="$2">
        {layers.map((layer) => (
          <Card
            key={layer.id}
            padding="$2"
            backgroundColor={layer.id === activeLayerId ? '#0ea5e9' : '#ffffff18'}
            borderRadius="$md"
            opacity={layer.visible ? 1 : 0.4}
          >
            <YStack gap="$2">
              <XStack alignItems="center" justifyContent="space-between" gap="$2">
                <Button size="$2" onPress={() => setActiveLayerId(layer.id)} disabled={layer.locked}>
                  {layer.name}
                </Button>
                <XStack gap="$1">
                  <Button size="$1" disabled={layer.isBackground} onPress={() => onToggleVisibility(layer.id)}>
                    {layer.visible ? 'Hide' : 'Show'}
                  </Button>
                  <Button size="$1" disabled={layer.isBackground} onPress={() => onMoveLayer(layer.id, 'up')}>
                    ↑
                  </Button>
                  <Button size="$1" disabled={layer.isBackground} onPress={() => onMoveLayer(layer.id, 'down')}>
                    ↓
                  </Button>
                </XStack>
              </XStack>
              {!layer.isBackground && (
                <Input
                  size="$2"
                  value={layer.name}
                  onChangeText={(value) => onRenameLayer(layer.id, value)}
                  onChange={(event) => onRenameLayer(layer.id, (event.target as HTMLInputElement).value)}
                />
              )}
              <Paragraph size="$1">{layer.elementIds.length} item(s)</Paragraph>
            </YStack>
          </Card>
        ))}
      </YStack>
    </ScrollView>
  </Card>
);

const HeaderBar = ({
  activeTheme,
  setActiveTheme,
  zoomPercent,
  setZoomPercent,
  onClear,
  onCopy,
  onPaste,
}: {
  activeTheme: ThemeVariant;
  setActiveTheme: (theme: ThemeVariant) => void;
  zoomPercent: number;
  setZoomPercent: (value: number) => void;
  onClear: () => void;
  onCopy: () => void;
  onPaste: () => void;
}) => (
  <Card padding="$3" backgroundColor="$muted" borderRadius="$lg">
    <XStack justifyContent="space-between" alignItems="center" gap="$3" flexWrap="wrap">
      <YStack>
        <H2 fontSize={24}>Imaginarium Studio</H2>
        <Paragraph size="$2">A friendly Konva playground that scales from toddlers to grown-ups.</Paragraph>
      </YStack>
      <XStack gap="$3" alignItems="center" flexWrap="wrap">
        <YStack>
          <Text fontWeight="600">Theme</Text>
          <XStack gap="$2">
            {(['kid', 'adult', 'midnight'] as ThemeVariant[]).map((theme) => (
              <Button
                key={theme}
                size="$2"
                backgroundColor={activeTheme === theme ? '#22c55e' : undefined}
                onPress={() => setActiveTheme(theme)}
              >
                {theme === 'kid' ? 'Playful' : theme === 'adult' ? 'Classic' : 'Night'}
              </Button>
            ))}
          </XStack>
        </YStack>
        <YStack width={160}>
          <Text fontWeight="600">Zoom ({zoomPercent}%)</Text>
          <Slider
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            value={[zoomPercent]}
            step={5}
            onValueChange={(values) => setZoomPercent(values[0] ?? zoomPercent)}
          />
        </YStack>
        <Button onPress={onCopy}>Copy</Button>
        <Button onPress={onPaste}>Paste</Button>
        <Button onPress={onClear} backgroundColor="#f97316">
          Clear canvas
        </Button>
      </XStack>
    </XStack>
  </Card>
);

type UploadImageButtonProps = {
  onUpload: (file: File) => void;
};

function UploadImageButton({ onUpload }: UploadImageButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <>
      <Button onPress={() => inputRef.current?.click()}>Upload from device</Button>
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        style={{ display: 'none' }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onUpload(file);
            event.target.value = '';
          }
        }}
      />
    </>
  );
}

type CanvasImageProps = {
  element: ImageElement;
  isSelectable: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<ImageElement>) => void;
};

function CanvasImage({ element, isSelectable, onSelect, onChange }: CanvasImageProps) {
  const image = useCanvasImage(element.src);
  return (
    <KonvaImage
      name={element.id}
      className={element.id}
      image={image ?? undefined}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      draggable={isSelectable}
      onDragEnd={(event) => {
        const node = event.target;
        onChange({ x: node.x(), y: node.y() });
      }}
      onTransformEnd={(event) => {
        const node = event.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(16, node.width() * scaleX),
          height: Math.max(16, node.height() * scaleY),
        });
      }}
      onClick={onSelect}
      onTap={onSelect}
      cornerRadius={12}
    />
  );
}
