(function (globalScope) {
const React = globalScope.React;
const ReactDOM = globalScope.ReactDOM;

if (!React || !ReactDOM) {
  throw new Error('React runtime not found. Include react-lite.js before react-app.js.');
}

const {
  createElement: h,
  useState,
  useEffect,
  useRef,
  useCallback
} = React;

const RNBridge = {
  get hasBridge() {
    return typeof globalScope !== 'undefined' && !!globalScope.ReactNativeWebView;
  },
  post(type, payload) {
    if (!this.hasBridge) {
      return;
    }

    try {
      globalScope.ReactNativeWebView.postMessage(
        JSON.stringify({ type, payload })
      );
    } catch (error) {
      console.warn('Failed to post message to React Native', error);
    }
  }
};

const TOOL_IDS = {
  SELECT: 'select',
  DRAW: 'draw',
  TEXT: 'text',
  SHAPES: 'shapes',
  IMAGES: 'images',
  FRAMES: 'frames',
  TEMPLATES: 'templates',
  LAYERS: 'layers',
  GUIDES: 'guides',
  BACKGROUND: 'background'
};

const ICONS = {
  select: '🖱️',
  draw: '✏️',
  text: '🔤',
  shapes: '⬚',
  images: '🖼️',
  frames: '🪟',
  templates: '📚',
  layers: '🧱',
  guides: '📐',
  background: '🎨',
  undo: '↺',
  redo: '↻',
  save: '💾',
  export: '📤',
  clear: '🗑️',
  download: '⬇️',
  fullscreen: '⛶',
  zoomIn: '＋',
  zoomOut: '－'
};

const SHAPE_OPTIONS = [
  { id: 'rect', label: 'Rounded Rectangle' },
  { id: 'ellipse', label: 'Ellipse' },
  { id: 'triangle', label: 'Triangle' },
  { id: 'line', label: 'Line' }
];

const FRAME_TYPES = [
  { id: 'rectangle', label: 'Rectangle' },
  { id: 'rounded', label: 'Rounded Rectangle' },
  { id: 'circle', label: 'Circle' },
  { id: 'ellipse', label: 'Ellipse' },
  { id: 'triangle', label: 'Triangle' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'heart', label: 'Heart' },
  { id: 'star', label: 'Star' }
];

const FONT_FAMILIES = [
  'Work Sans',
  'Inter',
  'Poppins',
  'Helvetica Neue',
  'Georgia',
  'Courier New'
];

const INITIAL_DIMENSIONS = { width: 1280, height: 720 };
const HISTORY_LIMIT = 50;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;
const GUIDE_THRESHOLD = 8;
const RULER_SIZE = 28;
const STORAGE_KEYS = {
  templates: 'fabric-react-editor.templates',
  autosave: 'fabric-react-editor.autosave'
};

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
}

function loadTemplatesFromStorage() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.templates);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.id === 'string');
  } catch (error) {
    console.warn('Failed to load templates from storage', error);
    return [];
  }
}

function saveTemplatesToStorage(templates) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(templates));
  } catch (error) {
    console.warn('Failed to persist templates', error);
  }
}

function writeAutosave(json) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.autosave, json);
  } catch (error) {
    console.warn('Unable to persist autosave snapshot', error);
  }
}

function readAutosave() {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEYS.autosave);
  } catch (error) {
    console.warn('Unable to read autosave snapshot', error);
    return null;
  }
}

function clearAutosave() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.autosave);
  } catch (error) {
    console.warn('Unable to clear autosave snapshot', error);
  }
}

function formatLayerLabel(object, index) {
  if (!object) return `Layer ${index + 1}`;
  const base = object.metadata && object.metadata.label;
  if (base) return base;
  if (object.type === 'textbox' || object.type === 'i-text') {
    const text = object.text || '';
    return text.length > 18 ? `${text.slice(0, 18)}…` : text || 'Text';
  }
  if (object.type === 'image') {
    return object.metadata && object.metadata.isFrame ? 'Frame' : 'Image';
  }
  return object.type ? object.type.charAt(0).toUpperCase() + object.type.slice(1) : `Layer ${index + 1}`;
}

function createFrameOptions(type) {
  switch (type) {
    case 'circle':
      return new fabric.Circle({ radius: 160, originX: 'center', originY: 'center' });
    case 'ellipse':
      return new fabric.Ellipse({ rx: 180, ry: 120, originX: 'center', originY: 'center' });
    case 'triangle':
      return new fabric.Triangle({ width: 280, height: 260, originX: 'center', originY: 'center' });
    case 'star': {
      const points = [];
      const spikes = 5;
      const outer = 160;
      const inner = 70;
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outer : inner;
        const angle = (Math.PI / spikes) * i - Math.PI / 2;
        points.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        });
      }
      return new fabric.Polygon(points, { originX: 'center', originY: 'center' });
    }
    case 'diamond':
      return new fabric.Polygon([
        { x: 0, y: -160 },
        { x: 140, y: 0 },
        { x: 0, y: 160 },
        { x: -140, y: 0 }
      ], { originX: 'center', originY: 'center' });
    case 'heart': {
      const path = 'M 0 -90 C -50 -150 -140 -120 -140 -40 C -140 40 -40 120 0 160 C 40 120 140 40 140 -40 C 140 -120 50 -150 0 -90 z';
      return new fabric.Path(path, { originX: 'center', originY: 'center', scaleX: 0.9, scaleY: 0.9 });
    }
    case 'rounded':
      return new fabric.Rect({ width: 320, height: 220, rx: 40, ry: 40, originX: 'center', originY: 'center' });
    case 'rectangle':
    default:
      return new fabric.Rect({ width: 320, height: 220, originX: 'center', originY: 'center' });
  }
}

function createPatternFromImage(image, width, height) {
  const element = image.getElement();
  if (!element) return null;
  const canvasEl = document.createElement('canvas');
  canvasEl.width = width;
  canvasEl.height = height;
  const ctx = canvasEl.getContext('2d');
  if (!ctx) return null;
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.drawImage(
    element,
    (width - drawWidth) / 2,
    (height - drawHeight) / 2,
    drawWidth,
    drawHeight
  );
  return new fabric.Pattern({ source: canvasEl, repeat: 'no-repeat' });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function downloadFile(filename, content, type = 'application/octet-stream') {
  if (RNBridge.hasBridge) {
    RNBridge.post('download', {
      filename,
      type,
      content: typeof content === 'string' ? content : null
    });
    return;
  }

  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadDataUrl(filename, dataUrl) {
  if (RNBridge.hasBridge) {
    RNBridge.post('download', {
      filename,
      type: 'data-url',
      content: dataUrl
    });
    return;
  }

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function getSelectionSnapshot(object) {
  if (!object) return null;
  const base = {
    type: object.type,
    fill: object.fill || '#ffffff',
    stroke: object.stroke || '#000000',
    strokeWidth: typeof object.strokeWidth === 'number' ? object.strokeWidth : 0,
    opacity: object.opacity == null ? 1 : object.opacity,
    width: object.getScaledWidth ? Math.round(object.getScaledWidth()) : object.width || 0,
    height: object.getScaledHeight ? Math.round(object.getScaledHeight()) : object.height || 0,
    angle: object.angle || 0
  };

  if (object.fontSize != null) {
    base.fontSize = Math.round(object.fontSize);
  }
  if (object.fontFamily) {
    base.fontFamily = object.fontFamily;
  }
  if (typeof object.text === 'string') {
    base.text = object.text;
  }

  return base;
}

function EditorApp() {
  const shellRef = useRef(null);
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [activeTool, setActiveTool] = useState(TOOL_IDS.SELECT);
  const [dimensions, setDimensions] = useState(INITIAL_DIMENSIONS);
  const [zoom, setZoom] = useState(1);
  const [showRulers, setShowRulers] = useState(true);
  const [guides, setGuides] = useState([]);
  const guidesRef = useRef(guides);
  const [draggingGuide, setDraggingGuide] = useState(null);
  const [brushColor, setBrushColor] = useState('#ffb347');
  const [brushSize, setBrushSize] = useState(8);
  const [shapeFill, setShapeFill] = useState('#ffffff');
  const [shapeStroke, setShapeStroke] = useState('#2f80ed');
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState(4);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textFontSize, setTextFontSize] = useState(56);
  const [textFontFamily, setTextFontFamily] = useState('Work Sans');
  const [backgroundColor, setBackgroundColor] = useState('#1f1f1f');
  const [selection, setSelection] = useState(null);
  const [historyState, setHistoryState] = useState({ undo: 0, redo: 0 });
  const [templates, setTemplates] = useState(() => loadTemplatesFromStorage());
  const [layers, setLayers] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const isRestoring = useRef(false);
  const historyTimer = useRef(null);
  const copyBufferRef = useRef(null);
  const hasLoadedAutosave = useRef(false);

  useEffect(() => {
    guidesRef.current = guides;
  }, [guides]);

  const pushToast = useCallback((message, tone = 'info') => {
    const id = createId('toast');
    setToasts((current) => [...current, { id, message, tone }]);
    return id;
  }, [updateLayersFromCanvas]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const updateLayersFromCanvas = useCallback((targetCanvas) => {
    if (!targetCanvas) {
      setLayers([]);
      return;
    }
    const objects = targetCanvas.getObjects();
    const snapshot = objects.map((object, index) => {
      if (!object.metadata) {
        object.metadata = {};
      }
      if (!object.metadata.id) {
        object.metadata.id = createId('obj');
      }
      return {
        id: object.metadata.id,
        label: formatLayerLabel(object, index),
        visible: object.visible !== false,
        locked: object.selectable === false || object.evented === false,
        type: object.type
      };
    }).reverse();
    setLayers(snapshot);
  }, []);

  useEffect(() => {
    updateLayersFromCanvas(canvas);
  }, [canvas, updateLayersFromCanvas]);

  const getObjectById = useCallback((id) => {
    if (!canvas || !id) return null;
    return canvas.getObjects().find((obj) => obj.metadata && obj.metadata.id === id) || null;
  }, [canvas]);

  useEffect(() => {
    if (!RNBridge.hasBridge) return;
    RNBridge.post('history', historyState);
  }, [historyState]);

  useEffect(() => {
    if (!RNBridge.hasBridge) return;
    RNBridge.post('selection', selection);
  }, [selection]);

  useEffect(() => {
    if (!RNBridge.hasBridge) return;
    RNBridge.post('dimensions', dimensions);
  }, [dimensions]);

  useEffect(() => {
    if (!RNBridge.hasBridge) return;
    RNBridge.post('background', { color: backgroundColor });
  }, [backgroundColor]);

  const emitDocumentJSON = useCallback(() => {
    if (!canvas) return null;
    try {
      return JSON.stringify(canvas.toDatalessJSON());
    } catch (error) {
      console.warn('Failed to serialize canvas', error);
      return null;
    }
  }, [canvas]);

  const captureSnapshot = useCallback((options = {}) => {
    if (!canvas) return;
    const serialized = emitDocumentJSON();
    if (!serialized) return;
    if (options.replace && undoStack.current.length) {
      undoStack.current[undoStack.current.length - 1] = serialized;
    } else if (!undoStack.current.length || undoStack.current[undoStack.current.length - 1] !== serialized) {
      undoStack.current.push(serialized);
      if (undoStack.current.length > HISTORY_LIMIT) {
        undoStack.current.shift();
      }
    }
    redoStack.current = [];
    setHistoryState({ undo: undoStack.current.length, redo: redoStack.current.length });
    writeAutosave(serialized);
    RNBridge.post('document', { json: serialized });
  }, [canvas, emitDocumentJSON]);

  const restoreSnapshot = useCallback((snapshot) => {
    if (!canvas || !snapshot) return;
    isRestoring.current = true;
    canvas.loadFromJSON(snapshot, () => {
      canvas.renderAll();
      isRestoring.current = false;
      updateLayersFromCanvas(canvas);
      const active = canvas.getActiveObject();
      setSelection(active ? getSelectionSnapshot(active) : null);
      RNBridge.post('document', { json: snapshot });
    });
  }, [canvas, updateLayersFromCanvas]);

  const scheduleSnapshot = useCallback(() => {
    if (isRestoring.current) return;
    if (historyTimer.current) {
      clearTimeout(historyTimer.current);
    }
    historyTimer.current = setTimeout(() => {
      historyTimer.current = null;
      captureSnapshot();
    }, 250);
  }, [captureSnapshot]);

  const applyZoom = useCallback((value, options = {}) => {
    if (!canvas) return;
    const clamped = clamp(value, ZOOM_MIN, ZOOM_MAX);
    const zoomPoint = options.point instanceof fabric.Point
      ? options.point
      : new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2);
    canvas.zoomToPoint(zoomPoint, clamped);
    setZoom(clamped);
    canvas.requestRenderAll();
  }, [canvas]);

  const zoomIn = useCallback(() => {
    applyZoom(zoom * 1.2);
  }, [applyZoom, zoom]);

  const zoomOut = useCallback(() => {
    applyZoom(zoom / 1.2);
  }, [applyZoom, zoom]);

  const resetZoom = useCallback(() => {
    applyZoom(1);
  }, [applyZoom]);

  const addGuide = useCallback((orientation, position) => {
    const limit = orientation === 'vertical' ? dimensions.width : dimensions.height;
    const clamped = clamp(position, 0, limit);
    const guide = { id: createId('guide'), orientation, position: clamped };
    setGuides((current) => [...current, guide]);
    return guide;
  }, [dimensions]);

  const updateGuide = useCallback((id, position, orientation) => {
    const limit = orientation === 'vertical' ? dimensions.width : dimensions.height;
    const clamped = clamp(position, 0, limit);
    setGuides((current) => current.map((guide) => guide.id === id ? { ...guide, position: clamped } : guide));
  }, [dimensions]);

  const removeGuide = useCallback((id) => {
    setGuides((current) => current.filter((guide) => guide.id !== id));
  }, []);

  const clearGuides = useCallback(() => {
    setGuides([]);
  }, []);

  const toggleRulers = useCallback(() => {
    setShowRulers((value) => !value);
  }, []);

  const handleRulerPointerDown = useCallback((orientation, event) => {
    if (!canvas || !stageRef.current) return;
    event.preventDefault();
    const rect = stageRef.current.getBoundingClientRect();
    let position;
    if (orientation === 'vertical') {
      position = (event.clientX - rect.left - RULER_SIZE) / zoom;
    } else {
      position = (event.clientY - rect.top - RULER_SIZE) / zoom;
    }
    const guide = addGuide(orientation, position);
    setDraggingGuide(guide);
  }, [canvas, addGuide, zoom]);

  const beginGuideDrag = useCallback((guide, event) => {
    event.preventDefault();
    setDraggingGuide({ id: guide.id, orientation: guide.orientation });
  }, []);

  const saveTemplate = useCallback(() => {
    if (!canvas) {
      pushToast('Canvas not ready', 'error');
      return;
    }
    const json = JSON.stringify(canvas.toDatalessJSON());
    const preview = canvas.toDataURL({ format: 'png', multiplier: 0.3 });
    const template = {
      id: createId('template'),
      name: `Template ${templates.length + 1}`,
      json,
      preview,
      createdAt: Date.now()
    };
    const next = [...templates, template];
    setTemplates(next);
    saveTemplatesToStorage(next);
    pushToast('Template saved', 'success');
  }, [canvas, templates, pushToast]);

  const overwriteTemplate = useCallback((id) => {
    if (!canvas) return;
    setTemplates((current) => {
      const next = current.map((template) => {
        if (template.id !== id) return template;
        return {
          ...template,
          json: JSON.stringify(canvas.toDatalessJSON()),
          preview: canvas.toDataURL({ format: 'png', multiplier: 0.3 }),
          updatedAt: Date.now()
        };
      });
      saveTemplatesToStorage(next);
      return next;
    });
    pushToast('Template updated', 'success');
  }, [canvas, pushToast]);

  const deleteTemplate = useCallback((id) => {
    setTemplates((current) => {
      const next = current.filter((template) => template.id !== id);
      saveTemplatesToStorage(next);
      return next;
    });
    pushToast('Template removed', 'info');
  }, [pushToast]);

  const renameTemplate = useCallback((id, name) => {
    setTemplates((current) => {
      const next = current.map((template) => template.id === id ? { ...template, name } : template);
      saveTemplatesToStorage(next);
      return next;
    });
  }, []);

  const applyTemplate = useCallback((id) => {
    const template = templates.find((item) => item.id === id);
    if (!template) return;
    undoStack.current = [template.json];
    redoStack.current = [];
    setHistoryState({ undo: undoStack.current.length, redo: redoStack.current.length });
    restoreSnapshot(template.json);
    pushToast('Template applied', 'success');
  }, [templates, restoreSnapshot, pushToast]);

  const selectLayer = useCallback((id) => {
    const object = getObjectById(id);
    if (!object || !canvas) return;
    canvas.discardActiveObject();
    canvas.setActiveObject(object);
    canvas.requestRenderAll();
    setSelection(getSelectionSnapshot(object));
  }, [canvas, getObjectById]);

  const toggleLayerVisibility = useCallback((id) => {
    const object = getObjectById(id);
    if (!object || !canvas) return;
    object.visible = !object.visible;
    object.dirty = true;
    canvas.requestRenderAll();
    updateLayersFromCanvas(canvas);
    scheduleSnapshot();
  }, [canvas, getObjectById, updateLayersFromCanvas, scheduleSnapshot]);

  const toggleLayerLock = useCallback((id) => {
    const object = getObjectById(id);
    if (!object || !canvas) return;
    const locked = object.selectable === false || object.evented === false;
    const nextLocked = !locked;
    object.selectable = !nextLocked;
    object.evented = !nextLocked;
    object.lockMovementX = nextLocked;
    object.lockMovementY = nextLocked;
    object.lockScalingX = nextLocked;
    object.lockScalingY = nextLocked;
    object.lockRotation = nextLocked;
    canvas.requestRenderAll();
    updateLayersFromCanvas(canvas);
    pushToast(nextLocked ? 'Layer locked' : 'Layer unlocked', 'info');
  }, [canvas, getObjectById, updateLayersFromCanvas, pushToast]);

  const moveLayer = useCallback((id, direction) => {
    const object = getObjectById(id);
    if (!object || !canvas) return;
    switch (direction) {
      case 'up':
        canvas.bringForward(object);
        break;
      case 'down':
        canvas.sendBackwards(object);
        break;
      case 'top':
        canvas.bringToFront(object);
        break;
      case 'bottom':
        canvas.sendToBack(object);
        break;
      default:
        break;
    }
    canvas.requestRenderAll();
    updateLayersFromCanvas(canvas);
    scheduleSnapshot();
  }, [canvas, getObjectById, updateLayersFromCanvas, scheduleSnapshot]);

  const deleteLayer = useCallback((id) => {
    const object = getObjectById(id);
    if (!object || !canvas) return;
    canvas.remove(object);
    canvas.requestRenderAll();
    updateLayersFromCanvas(canvas);
    scheduleSnapshot();
    pushToast('Layer removed', 'info');
  }, [canvas, getObjectById, updateLayersFromCanvas, scheduleSnapshot, pushToast]);

  const copySelection = useCallback(() => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    active.clone((cloned) => {
      copyBufferRef.current = cloned;
      pushToast('Selection copied', 'info');
    }, ['metadata']);
  }, [canvas, pushToast]);

  const pasteSelection = useCallback(() => {
    if (!canvas || !copyBufferRef.current) return;
    copyBufferRef.current.clone((cloned) => {
      cloned.set({
        left: (cloned.left || 0) + 24,
        top: (cloned.top || 0) + 24
      });
      if (!cloned.metadata) {
        cloned.metadata = {};
      }
      cloned.metadata.id = createId('obj');
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
      updateLayersFromCanvas(canvas);
      scheduleSnapshot();
      pushToast('Selection pasted', 'success');
    });
  }, [canvas, updateLayersFromCanvas, scheduleSnapshot, pushToast]);

  const duplicateSelection = useCallback(() => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    active.clone((cloned) => {
      cloned.set({
        left: (active.left || 0) + 32,
        top: (active.top || 0) + 32
      });
      if (!cloned.metadata) {
        cloned.metadata = {};
      }
      cloned.metadata.id = createId('obj');
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
      updateLayersFromCanvas(canvas);
      scheduleSnapshot();
    });
  }, [canvas, updateLayersFromCanvas, scheduleSnapshot]);

  const deleteSelection = useCallback(() => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects ? canvas.getActiveObjects() : [];
    if (!activeObjects || activeObjects.length === 0) {
      const single = canvas.getActiveObject();
      if (!single) return;
      canvas.remove(single);
    } else {
      activeObjects.forEach((obj) => canvas.remove(obj));
    }
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    updateLayersFromCanvas(canvas);
    scheduleSnapshot();
    pushToast('Selection removed', 'info');
  }, [canvas, updateLayersFromCanvas, scheduleSnapshot, pushToast]);

  const saveToBrowser = useCallback(() => {
    const json = emitDocumentJSON();
    if (!json) {
      pushToast('Nothing to save', 'error');
      return;
    }
    writeAutosave(json);
    pushToast('Design saved locally', 'success');
  }, [emitDocumentJSON, pushToast]);

  const loadFromBrowser = useCallback(() => {
    const saved = readAutosave();
    if (!saved) {
      pushToast('No draft found', 'error');
      return;
    }
    undoStack.current = [saved];
    redoStack.current = [];
    setHistoryState({ undo: undoStack.current.length, redo: 0 });
    restoreSnapshot(saved);
    pushToast('Draft restored', 'success');
  }, [restoreSnapshot, pushToast]);

  const clearSavedDesign = useCallback(() => {
    clearAutosave();
    pushToast('Local draft cleared', 'info');
  }, [pushToast]);

  const toggleFullscreen = useCallback(() => {
    const element = shellRef.current;
    if (!element) return;
    if (!document.fullscreenElement) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement || !window.fabric) return;

    canvasElement.width = INITIAL_DIMENSIONS.width;
    canvasElement.height = INITIAL_DIMENSIONS.height;

    const fabricCanvas = new fabric.Canvas(canvasElement, {
      width: INITIAL_DIMENSIONS.width,
      height: INITIAL_DIMENSIONS.height,
      backgroundColor,
      preserveObjectStacking: true,
      selectionColor: 'rgba(91, 157, 255, 0.2)',
      selectionBorderColor: '#5b9dff',
      selectionLineWidth: 2
    });

    fabricCanvas.freeDrawingBrush.color = brushColor;
    fabricCanvas.freeDrawingBrush.width = brushSize;

    const syncSelection = () => {
      const active = fabricCanvas.getActiveObject();
      setSelection(active ? getSelectionSnapshot(active) : null);
    };

    const scheduleSnapshot = () => {
      if (isRestoring.current) return;
      if (historyTimer.current) {
        clearTimeout(historyTimer.current);
      }
      historyTimer.current = setTimeout(() => {
        historyTimer.current = null;
        captureSnapshot();
      }, 240);
    };

    const captureSnapshot = (options = {}) => {
      if (!fabricCanvas) return;
      const serialized = JSON.stringify(fabricCanvas.toDatalessJSON());
      if (!serialized) return;
      if (options.replace && undoStack.current.length) {
        undoStack.current[undoStack.current.length - 1] = serialized;
      } else if (!undoStack.current.length || undoStack.current[undoStack.current.length - 1] !== serialized) {
        undoStack.current.push(serialized);
        if (undoStack.current.length > HISTORY_LIMIT) {
          undoStack.current.shift();
        }
      }
      redoStack.current = [];
      setHistoryState({ undo: undoStack.current.length, redo: redoStack.current.length });
      writeAutosave(serialized);
      RNBridge.post('document', { json: serialized });
    };

    const restoreSnapshot = (snapshot) => {
      if (!snapshot) return;
      isRestoring.current = true;
      fabricCanvas.loadFromJSON(snapshot, () => {
        fabricCanvas.renderAll();
        isRestoring.current = false;
        setTimeout(() => syncSelection(), 0);
        updateLayersFromCanvas(fabricCanvas);
      });
    };

    const handleMutation = () => {
      syncSelection();
      scheduleSnapshot();
      updateLayersFromCanvas(fabricCanvas);
    };

    const handleSelection = () => {
      syncSelection();
    };

    const handleSelectionCleared = () => {
      setSelection(null);
    };

    const handleObjectMoving = (event) => {
      const target = event.target;
      if (!target) return;
      const center = target.getCenterPoint();
      let snapX = center.x;
      let snapY = center.y;
      let snapped = false;
      const activeGuides = guidesRef.current || [];

      activeGuides.forEach((guide) => {
        if (guide.orientation === 'vertical') {
          if (Math.abs(center.x - guide.position) <= GUIDE_THRESHOLD) {
            snapX = guide.position;
            snapped = true;
          }
        } else {
          if (Math.abs(center.y - guide.position) <= GUIDE_THRESHOLD) {
            snapY = guide.position;
            snapped = true;
          }
        }
      });

      const midX = fabricCanvas.getWidth() / 2;
      const midY = fabricCanvas.getHeight() / 2;
      if (Math.abs(center.x - midX) <= GUIDE_THRESHOLD) {
        snapX = midX;
        snapped = true;
      }
      if (Math.abs(center.y - midY) <= GUIDE_THRESHOLD) {
        snapY = midY;
        snapped = true;
      }

      if (snapped) {
        target.setPositionByOrigin(new fabric.Point(snapX, snapY), 'center', 'center');
        target.setCoords();
      }
    };

    fabricCanvas.on('object:added', handleMutation);
    fabricCanvas.on('object:modified', handleMutation);
    fabricCanvas.on('object:removed', handleMutation);
    fabricCanvas.on('path:created', handleMutation);
    fabricCanvas.on('object:moving', handleObjectMoving);
    fabricCanvas.on('selection:created', handleSelection);
    fabricCanvas.on('selection:updated', handleSelection);
    fabricCanvas.on('selection:cleared', handleSelectionCleared);

    setCanvas(fabricCanvas);
    captureSnapshot();
    updateLayersFromCanvas(fabricCanvas);
    setZoom(fabricCanvas.getZoom());

    return () => {
      if (historyTimer.current) {
        clearTimeout(historyTimer.current);
        historyTimer.current = null;
      }
      fabricCanvas.off('object:added', handleMutation);
      fabricCanvas.off('object:modified', handleMutation);
      fabricCanvas.off('object:removed', handleMutation);
      fabricCanvas.off('path:created', handleMutation);
      fabricCanvas.off('object:moving', handleObjectMoving);
      fabricCanvas.off('selection:created', handleSelection);
      fabricCanvas.off('selection:updated', handleSelection);
      fabricCanvas.off('selection:cleared', handleSelectionCleared);
      fabricCanvas.dispose();
      undoStack.current = [];
      redoStack.current = [];
      setHistoryState({ undo: 0, redo: 0 });
    };
  }, []);

  useEffect(() => {
    if (!canvas || !stageRef.current) return;
    const element = stageRef.current;
    const handleWheel = (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const direction = event.deltaY < 0 ? 1.1 : 0.9;
      const next = clamp(zoom * direction, ZOOM_MIN, ZOOM_MAX);
      const pointer = canvas.getPointer(event);
      const focusPoint = new fabric.Point(pointer.x, pointer.y);
      applyZoom(next, { point: focusPoint });
    };
    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      element.removeEventListener('wheel', handleWheel);
    };
  }, [canvas, applyZoom, zoom]);

  useEffect(() => {
    if (!draggingGuide || !stageRef.current) return;
    const handleMove = (event) => {
      if (!canvas) return;
      const rect = stageRef.current.getBoundingClientRect();
      if (draggingGuide.orientation === 'vertical') {
        const position = (event.clientX - rect.left - RULER_SIZE) / zoom;
        updateGuide(draggingGuide.id, position, 'vertical');
      } else {
        const position = (event.clientY - rect.top - RULER_SIZE) / zoom;
        updateGuide(draggingGuide.id, position, 'horizontal');
      }
    };
    const handleUp = () => {
      setDraggingGuide(null);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [draggingGuide, canvas, zoom, updateGuide]);

  useEffect(() => {
    if (!canvas || hasLoadedAutosave.current) return;
    hasLoadedAutosave.current = true;
    const saved = readAutosave();
    if (saved) {
      undoStack.current = [saved];
      redoStack.current = [];
      setHistoryState({ undo: undoStack.current.length, redo: 0 });
      restoreSnapshot(saved);
      pushToast('Autosaved draft restored', 'info');
    }
  }, [canvas, restoreSnapshot, pushToast]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!canvas) return;
      if (event.target && ['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
        return;
      }
      const key = event.key.toLowerCase();
      const isMeta = event.metaKey || event.ctrlKey;
      if (isMeta && key === 'c') {
        event.preventDefault();
        copySelection();
      } else if (isMeta && key === 'v') {
        event.preventDefault();
        pasteSelection();
      } else if (isMeta && key === 'd') {
        event.preventDefault();
        duplicateSelection();
      } else if (key === 'delete' || key === 'backspace') {
        event.preventDefault();
        deleteSelection();
      } else if (isMeta && key === 's') {
        event.preventDefault();
        saveToBrowser();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canvas, copySelection, pasteSelection, duplicateSelection, deleteSelection, saveToBrowser]);

  useEffect(() => {
    if (!canvas || !RNBridge.hasBridge) return;
    RNBridge.post('ready', {
      dimensions,
      backgroundColor,
      history: historyState,
      selection
    });
  }, [canvas, dimensions, backgroundColor, historyState, selection]);

  useEffect(() => {
    if (!canvas || !RNBridge.hasBridge) return;

    const handleNativeMessage = (event) => {
      const raw = event.data != null ? event.data : event.detail;
      if (!raw) return;

      let message = raw;
      if (typeof raw === 'string') {
        try {
          message = JSON.parse(raw);
        } catch (error) {
          console.warn('Failed to parse React Native message', error);
          return;
        }
      }

      if (!message || typeof message !== 'object') return;

      const { type, payload } = message;
      switch (type) {
        case 'undo':
          undo();
          break;
        case 'redo':
          redo();
          break;
        case 'clear':
          clearCanvas();
          break;
        case 'setBackgroundColor':
          if (payload && typeof payload.color === 'string') {
            setBackgroundColor(payload.color);
          }
          break;
        case 'setDimensions':
          if (payload) {
            const width = typeof payload.width === 'number' ? clamp(payload.width, 320, 4096) : dimensions.width;
            const height = typeof payload.height === 'number' ? clamp(payload.height, 320, 4096) : dimensions.height;
            setDimensions({ width, height });
          }
          break;
        case 'load':
          if (payload && typeof payload.json === 'string') {
            undoStack.current = [payload.json];
            redoStack.current = [];
            restoreSnapshot(payload.json);
            setHistoryState({ undo: undoStack.current.length, redo: redoStack.current.length });
          }
          break;
        case 'export': {
          const format = payload && payload.format === 'json' ? 'json' : 'png';
          if (format === 'json') {
            emitJSONExport();
          } else {
            emitPNGExport();
          }
          break;
        }
        case 'insertImage':
          if (payload && typeof payload.src === 'string') {
            insertImageFromSource(payload.src, payload.options || {});
          }
          break;
        default:
          break;
      }
    };

    globalScope.addEventListener('message', handleNativeMessage);
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('message', handleNativeMessage);
    }

    return () => {
      globalScope.removeEventListener('message', handleNativeMessage);
      if (typeof document !== 'undefined' && document.removeEventListener) {
        document.removeEventListener('message', handleNativeMessage);
      }
    };
  }, [canvas, clearCanvas, undo, redo, restoreSnapshot, emitJSONExport, emitPNGExport, captureSnapshot, dimensions, insertImageFromSource]);

  useEffect(() => {
    if (!canvas) return;
    const { width, height } = dimensions;
    canvas.setWidth(width);
    canvas.setHeight(height);
    if (canvasRef.current) {
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    }
    canvas.requestRenderAll();
    scheduleSnapshot();
  }, [canvas, dimensions]);

  useEffect(() => {
    if (!canvas) return;
    canvas.setBackgroundColor(backgroundColor, () => {
      canvas.renderAll();
      scheduleSnapshot();
    });
  }, [canvas, backgroundColor]);

  useEffect(() => {
    if (!canvas) return;
    const isDrawing = activeTool === TOOL_IDS.DRAW;
    canvas.isDrawingMode = isDrawing;
    canvas.defaultCursor = isDrawing ? 'crosshair' : 'default';
    if (isDrawing) {
      canvas.discardActiveObject();
      const brush = canvas.freeDrawingBrush;
      brush.color = brushColor;
      brush.width = brushSize;
    }
    canvas.requestRenderAll();
  }, [canvas, activeTool]);

  useEffect(() => {
    if (!canvas) return;
    if (canvas.isDrawingMode) {
      canvas.freeDrawingBrush.color = brushColor;
    }
  }, [canvas, brushColor]);

  useEffect(() => {
    if (!canvas) return;
    if (canvas.isDrawingMode) {
      canvas.freeDrawingBrush.width = brushSize;
    }
  }, [canvas, brushSize]);

  const addShape = (type) => {
    if (!canvas) return;
    const centerX = canvas.getWidth() / 2;
    const centerY = canvas.getHeight() / 2;
    const shapeOptions = {
      fill: shapeFill,
      stroke: shapeStroke,
      strokeWidth: shapeStrokeWidth,
      left: centerX - 90,
      top: centerY - 90
    };

    let shape;
    switch (type) {
      case 'ellipse':
        shape = new fabric.Ellipse({
          ...shapeOptions,
          rx: 120,
          ry: 80
        });
        break;
      case 'triangle':
        shape = new fabric.Triangle({
          ...shapeOptions,
          width: 200,
          height: 180
        });
        break;
      case 'line':
        shape = new fabric.Line([centerX - 120, centerY, centerX + 120, centerY], {
          stroke: shapeStroke,
          strokeWidth: shapeStrokeWidth,
          fill: shapeStroke
        });
        break;
      case 'rect':
      default:
        shape = new fabric.Rect({
          ...shapeOptions,
          width: 220,
          height: 160,
          rx: 24,
          ry: 24
        });
        break;
    }

    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.requestRenderAll();
      captureSnapshot();
      setActiveTool(TOOL_IDS.SELECT);
      setSelection(getSelectionSnapshot(shape));
    }
  };

  const addFrame = useCallback((type) => {
    if (!canvas) return;
    const frameShape = createFrameOptions(type);
    if (!frameShape) return;
    frameShape.set({
      originX: 'center',
      originY: 'center',
      left: canvas.getWidth() / 2,
      top: canvas.getHeight() / 2,
      stroke: '#f2f2f2',
      strokeWidth: 3,
      fill: 'rgba(255,255,255,0.08)'
    });
    frameShape.metadata = {
      id: createId('obj'),
      isFrame: true,
      frameType: type,
      label: `${type.charAt(0).toUpperCase()}${type.slice(1)} Frame`
    };
    canvas.add(frameShape);
    canvas.setActiveObject(frameShape);
    canvas.requestRenderAll();
    updateLayersFromCanvas(canvas);
    scheduleSnapshot();
    setActiveTool(TOOL_IDS.SELECT);
    setSelection(getSelectionSnapshot(frameShape));
  }, [canvas, updateLayersFromCanvas, scheduleSnapshot]);

  const addText = () => {
    if (!canvas) return;
    const text = new fabric.IText('Double click to edit', {
      fill: textColor,
      fontSize: textFontSize,
      fontFamily: textFontFamily,
      left: canvas.getWidth() / 2 - 140,
      top: canvas.getHeight() / 2 - 30,
      fontWeight: '600',
      editable: true
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
    captureSnapshot();
    setActiveTool(TOOL_IDS.SELECT);
    setSelection(getSelectionSnapshot(text));
  };

  const insertImageFromSource = useCallback((src, options = {}) => {
    if (!canvas || !src) return;
    fabric.Image.fromURL(src, (img) => {
      if (!img) return;
      const active = canvas.getActiveObject();
      const isFrameTarget = active && active.metadata && active.metadata.isFrame;
      if (isFrameTarget) {
        const frameWidth = active.getScaledWidth();
        const frameHeight = active.getScaledHeight();
        const pattern = createPatternFromImage(img, frameWidth, frameHeight);
        if (pattern) {
          active.set('fill', pattern);
          active.metadata.frameImage = src;
          canvas.requestRenderAll();
          scheduleSnapshot();
          setSelection(getSelectionSnapshot(active));
          pushToast('Frame updated', 'success');
        }
        return;
      }

      const maxWidth = canvas.getWidth() * 0.8;
      const maxHeight = canvas.getHeight() * 0.8;
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
      img.scale(scale);
      const left = options.left != null ? options.left : canvas.getWidth() / 2 - (img.getScaledWidth() / 2);
      const top = options.top != null ? options.top : canvas.getHeight() / 2 - (img.getScaledHeight() / 2);
      img.set({ left, top });
      if (!img.metadata) {
        img.metadata = {};
      }
      img.metadata.id = createId('obj');
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
      updateLayersFromCanvas(canvas);
      scheduleSnapshot();
      setSelection(getSelectionSnapshot(img));
      pushToast('Image added', 'success');
    }, { crossOrigin: 'anonymous' });
  }, [canvas, updateLayersFromCanvas, scheduleSnapshot, pushToast]);

  const handleImageUpload = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target && e.target.result;
      if (!dataUrl) return;
      insertImageFromSource(dataUrl);
      setActiveTool(TOOL_IDS.SELECT);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const clearCanvas = useCallback(() => {
    if (!canvas) return;
    const background = canvas.backgroundColor;
    canvas.getObjects().slice().forEach((obj) => canvas.remove(obj));
    canvas.backgroundColor = background;
    canvas.renderAll();
    undoStack.current = [];
    redoStack.current = [];
    setHistoryState({ undo: 0, redo: 0 });
    setSelection(null);
    updateLayersFromCanvas(canvas);
    clearGuides();
    clearAutosave();
    captureSnapshot({ replace: true });
  }, [canvas, captureSnapshot, updateLayersFromCanvas, clearGuides]);

  const undo = useCallback(() => {
    if (!canvas) return;
    if (undoStack.current.length <= 1) return;
    const current = undoStack.current.pop();
    redoStack.current.push(current);
    const snapshot = undoStack.current[undoStack.current.length - 1];
    restoreSnapshot(snapshot);
    setHistoryState({ undo: undoStack.current.length, redo: redoStack.current.length });
  }, [canvas, restoreSnapshot]);

  const redo = useCallback(() => {
    if (!canvas) return;
    if (!redoStack.current.length) return;
    const snapshot = redoStack.current.pop();
    undoStack.current.push(snapshot);
    restoreSnapshot(snapshot);
    setHistoryState({ undo: undoStack.current.length, redo: redoStack.current.length });
  }, [canvas, restoreSnapshot]);

  const emitJSONExport = useCallback(() => {
    if (!canvas) return null;
    const serialized = emitDocumentJSON();
    if (serialized) {
      RNBridge.post('export', { format: 'json', data: serialized });
    }
    return serialized;
  }, [canvas, emitDocumentJSON]);

  const emitPNGExport = useCallback(() => {
    if (!canvas) return null;
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2, enableRetinaScaling: true });
    RNBridge.post('export', { format: 'png', dataUrl });
    return dataUrl;
  }, [canvas]);

  const saveAsJSON = useCallback(() => {
    if (!canvas) return;
    const serialized = emitJSONExport();
    if (!RNBridge.hasBridge && serialized) {
      let formatted = serialized;
      try {
        formatted = JSON.stringify(JSON.parse(serialized), null, 2);
      } catch (error) {
        console.warn('Failed to pretty print JSON export', error);
      }
      downloadFile('fabric-design.json', formatted, 'application/json');
    }
  }, [canvas, emitJSONExport]);

  const exportPNG = useCallback(() => {
    if (!canvas) return;
    const dataUrl = emitPNGExport();
    if (!RNBridge.hasBridge && dataUrl) {
      downloadDataUrl('fabric-design.png', dataUrl);
    }
  }, [canvas, emitPNGExport]);

  const applySelectionChange = (updates) => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;

    Object.keys(updates).forEach((key) => {
      const value = updates[key];
      if (key === 'text' && typeof active.text === 'string') {
        active.set('text', value);
      } else if (key === 'fontSize' && active.set) {
        active.set('fontSize', value);
      } else if (key === 'fontFamily' && active.set) {
        active.set('fontFamily', value);
      } else if (key === 'fill' && active.set) {
        active.set('fill', value);
      } else if (key === 'stroke' && active.set) {
        active.set('stroke', value);
      } else if (key === 'strokeWidth' && active.set) {
        active.set('strokeWidth', value);
      } else if (key === 'opacity' && active.set) {
        active.set('opacity', value);
      }
    });

    active.setCoords();
    canvas.requestRenderAll();
    scheduleSnapshot();
    const snapshot = getSelectionSnapshot(active);
    setSelection(snapshot);
  };

  const toolbarButtons = [
    { id: TOOL_IDS.SELECT, label: 'Select', icon: ICONS.select },
    { id: TOOL_IDS.DRAW, label: 'Draw', icon: ICONS.draw },
    { id: TOOL_IDS.TEXT, label: 'Text', icon: ICONS.text },
    { id: TOOL_IDS.SHAPES, label: 'Shapes', icon: ICONS.shapes },
    { id: TOOL_IDS.IMAGES, label: 'Images', icon: ICONS.images },
    { id: TOOL_IDS.FRAMES, label: 'Frames', icon: ICONS.frames },
    { id: TOOL_IDS.TEMPLATES, label: 'Templates', icon: ICONS.templates },
    { id: TOOL_IDS.LAYERS, label: 'Layers', icon: ICONS.layers },
    { id: TOOL_IDS.GUIDES, label: 'Guides', icon: ICONS.guides },
    { id: TOOL_IDS.BACKGROUND, label: 'Canvas', icon: ICONS.background }
  ];

  return h('div', { className: 'editor-shell', ref: shellRef },
    h('header', { className: 'editor-toolbar' },
      h('div', { className: 'toolbar-group' },
        toolbarButtons.map((btn) => (
          h('button', {
            className: `toolbar-button${activeTool === btn.id ? ' active' : ''}`,
            onClick: () => setActiveTool(btn.id)
          }, `${btn.icon} ${btn.label}`)
        ))
      ),
      h('div', { className: 'toolbar-group' },
        h('button', {
          className: 'toolbar-button',
          onClick: undo,
          disabled: historyState.undo <= 1
        }, `${ICONS.undo} Undo`),
        h('button', {
          className: 'toolbar-button',
          onClick: redo,
          disabled: historyState.redo === 0
        }, `${ICONS.redo} Redo`)
      ),
      h('div', { className: 'toolbar-group' },
        h('button', { className: 'toolbar-button', onClick: saveAsJSON }, `${ICONS.save} Save JSON`),
        h('button', { className: 'toolbar-button', onClick: exportPNG }, `${ICONS.export} Export PNG`)
      ),
      h('div', { className: 'toolbar-group' },
        h('button', { className: 'toolbar-button', onClick: zoomOut }, `${ICONS.zoomOut}`),
        h('span', { className: 'toolbar-readout' }, `${Math.round(zoom * 100)}%`),
        h('button', { className: 'toolbar-button', onClick: zoomIn }, `${ICONS.zoomIn}`),
        h('button', { className: 'toolbar-button', onClick: resetZoom }, 'Reset Zoom')
      ),
      h('div', { className: 'toolbar-group' },
        h('button', { className: 'toolbar-button', onClick: toggleRulers }, `${ICONS.guides} Rulers ${showRulers ? 'On' : 'Off'}`),
        h('button', { className: 'toolbar-button', onClick: toggleFullscreen }, `${ICONS.fullscreen} ${isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}`)
      ),
      h('div', { className: 'toolbar-group' },
        h('button', { className: 'toolbar-button danger', onClick: clearCanvas }, `${ICONS.clear} Clear Canvas`)
      )
    ),
    h('div', { className: 'editor-body' },
      h(Sidebar, {
        activeTool,
        brushColor,
        brushSize,
        onBrushColor: setBrushColor,
        onBrushSize: (value) => setBrushSize(clamp(value, 1, 200)),
        shapeFill,
        shapeStroke,
        shapeStrokeWidth,
        onShapeFill: setShapeFill,
        onShapeStroke: setShapeStroke,
        onShapeStrokeWidth: (value) => setShapeStrokeWidth(clamp(value, 0, 40)),
        addShape,
        textColor,
        textFontSize,
        textFontFamily,
        onTextColor: setTextColor,
        onTextFontSize: (value) => setTextFontSize(clamp(value, 8, 260)),
        onTextFontFamily: setTextFontFamily,
        addText,
        handleImageUpload,
        dimensions,
        onDimensionsChange: setDimensions,
        backgroundColor,
        onBackgroundColor: setBackgroundColor,
        selection,
        applySelectionChange,
        addFrame,
        templates,
        onCreateTemplate: saveTemplate,
        onApplyTemplate: applyTemplate,
        onOverwriteTemplate: overwriteTemplate,
        onDeleteTemplate: deleteTemplate,
        onRenameTemplate: renameTemplate,
        layers,
        onLayerSelect: selectLayer,
        onLayerVisibility: toggleLayerVisibility,
        onLayerLock: toggleLayerLock,
        onLayerMove: moveLayer,
        onLayerDelete: deleteLayer,
        onCopySelection: copySelection,
        onPasteSelection: pasteSelection,
        onDuplicateSelection: duplicateSelection,
        onDeleteSelection: deleteSelection,
        guides,
        showRulers,
        onToggleRulers: toggleRulers,
        onClearGuides: clearGuides,
        onAddGuide: addGuide,
        onRemoveGuide: removeGuide,
        zoom,
        onZoomChange: applyZoom,
        onZoomIn: zoomIn,
        onZoomOut: zoomOut,
        onZoomReset: resetZoom,
        onSaveToBrowser: saveToBrowser,
        onLoadFromBrowser: loadFromBrowser,
        onClearSaved: clearSavedDesign
      }),
      h('main', { className: 'canvas-wrapper' },
        h('div', { className: 'canvas-stage', ref: stageRef },
          showRulers && h(Rulers, {
            width: dimensions.width,
            height: dimensions.height,
            zoom,
            onPointerDown: handleRulerPointerDown
          }),
          h('div', { className: 'canvas-surface' },
            h('canvas', { ref: canvasRef, width: dimensions.width, height: dimensions.height })
          ),
          h(GuideOverlay, {
            guides,
            zoom,
            width: dimensions.width,
            height: dimensions.height,
            onPointerDown: beginGuideDrag,
            onRemove: removeGuide
          })
        )
      )
    ),
    toasts.length > 0 && h(ToastList, { toasts, onDismiss: removeToast })
  );
}

function Sidebar(props) {
  const {
    activeTool,
    brushColor,
    brushSize,
    onBrushColor,
    onBrushSize,
    shapeFill,
    shapeStroke,
    shapeStrokeWidth,
    onShapeFill,
    onShapeStroke,
    onShapeStrokeWidth,
    addShape,
    textColor,
    textFontSize,
    textFontFamily,
    onTextColor,
    onTextFontSize,
    onTextFontFamily,
    addText,
    handleImageUpload,
    dimensions,
    onDimensionsChange,
    backgroundColor,
    onBackgroundColor,
    selection,
    applySelectionChange,
    addFrame,
    templates,
    onCreateTemplate,
    onApplyTemplate,
    onOverwriteTemplate,
    onDeleteTemplate,
    onRenameTemplate,
    layers,
    onLayerSelect,
    onLayerVisibility,
    onLayerLock,
    onLayerMove,
    onLayerDelete,
    onCopySelection,
    onPasteSelection,
    onDuplicateSelection,
    onDeleteSelection,
    guides,
    showRulers,
    onToggleRulers,
    onClearGuides,
    onAddGuide,
    onRemoveGuide,
    zoom,
    onZoomChange,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onSaveToBrowser,
    onLoadFromBrowser,
    onClearSaved
  } = props;

  let panelContent;
  switch (activeTool) {
    case TOOL_IDS.DRAW:
      panelContent = h(DrawPanel, { brushColor, brushSize, onBrushColor, onBrushSize });
      break;
    case TOOL_IDS.SHAPES:
      panelContent = h(ShapesPanel, {
        shapeFill,
        shapeStroke,
        shapeStrokeWidth,
        onShapeFill,
        onShapeStroke,
        onShapeStrokeWidth,
        addShape
      });
      break;
    case TOOL_IDS.TEXT:
      panelContent = h(TextPanel, {
        textColor,
        textFontSize,
        textFontFamily,
        onTextColor,
        onTextFontSize,
        onTextFontFamily,
        addText
      });
      break;
    case TOOL_IDS.IMAGES:
      panelContent = h(ImagesPanel, { handleImageUpload });
      break;
    case TOOL_IDS.FRAMES:
      panelContent = h(FramesPanel, { addFrame });
      break;
    case TOOL_IDS.TEMPLATES:
      panelContent = h(TemplatesPanel, {
        templates,
        onCreateTemplate,
        onApplyTemplate,
        onOverwriteTemplate,
        onDeleteTemplate,
        onRenameTemplate,
        onSaveToBrowser,
        onLoadFromBrowser,
        onClearSaved
      });
      break;
    case TOOL_IDS.LAYERS:
      panelContent = h(LayersPanel, {
        layers,
        onLayerSelect,
        onLayerVisibility,
        onLayerLock,
        onLayerMove,
        onLayerDelete,
        onCopySelection,
        onPasteSelection,
        onDuplicateSelection,
        onDeleteSelection
      });
      break;
    case TOOL_IDS.GUIDES:
      panelContent = h(GuidesPanel, {
        guides,
        showRulers,
        onToggleRulers,
        onClearGuides,
        onAddGuide,
        onRemoveGuide,
        zoom,
        onZoomChange,
        onZoomIn,
        onZoomOut,
        onZoomReset,
        dimensions
      });
      break;
    case TOOL_IDS.BACKGROUND:
      panelContent = h(BackgroundPanel, { dimensions, onDimensionsChange, backgroundColor, onBackgroundColor });
      break;
    case TOOL_IDS.SELECT:
    default:
      panelContent = h(SelectionPanel, { selection, applySelectionChange });
      break;
  }

  return h('aside', { className: 'editor-sidebar' },
    h('h2', { className: 'sidebar-title' }, 'Tool Options'),
    panelContent || h('p', { className: 'empty-panel-message' }, 'Select a tool to customize its settings.')
  );
}

function DrawPanel({ brushColor, brushSize, onBrushColor, onBrushSize }) {
  return h('div', { className: 'sidebar-section' },
    h('h3', null, 'Freehand Drawing'),
    h('div', { className: 'form-row' },
      h('label', { className: 'form-label' }, 'Brush Color'),
      h('input', {
        className: 'form-color',
        type: 'color',
        value: brushColor,
        onChange: (e) => onBrushColor(e.target.value)
      })
    ),
    h('div', { className: 'form-row' },
      h('label', { className: 'form-label' }, `Brush Size (${brushSize}px)`),
      h('input', {
        className: 'form-slider',
        type: 'range',
        min: 1,
        max: 200,
        value: brushSize,
        onChange: (e) => onBrushSize(Number(e.target.value))
      })
    )
  );
}

function ShapesPanel({ shapeFill, shapeStroke, shapeStrokeWidth, onShapeFill, onShapeStroke, onShapeStrokeWidth, addShape }) {
  return h('div', { className: 'sidebar-section' },
    h('h3', null, 'Vector Shapes'),
    h('div', { className: 'form-row' },
      h('label', { className: 'form-label' }, 'Fill'),
      h('input', {
        className: 'form-color',
        type: 'color',
        value: shapeFill,
        onChange: (e) => onShapeFill(e.target.value)
      })
    ),
    h('div', { className: 'form-row' },
      h('label', { className: 'form-label' }, 'Stroke'),
      h('input', {
        className: 'form-color',
        type: 'color',
        value: shapeStroke,
        onChange: (e) => onShapeStroke(e.target.value)
      })
    ),
    h('div', { className: 'form-row' },
      h('label', { className: 'form-label' }, `Stroke Width (${shapeStrokeWidth}px)`),
      h('input', {
        className: 'form-slider',
        type: 'range',
        min: 0,
        max: 40,
        value: shapeStrokeWidth,
        onChange: (e) => onShapeStrokeWidth(Number(e.target.value))
      })
    ),
    h('div', { className: 'panel-actions' },
      SHAPE_OPTIONS.map((shape) => h('button', {
        onClick: () => addShape(shape.id)
      }, shape.label))
    )
  );
}

function TextPanel({ textColor, textFontSize, textFontFamily, onTextColor, onTextFontSize, onTextFontFamily, addText }) {
  return h('div', { className: 'sidebar-section' },
    h('h3', null, 'Typography'),
    h('div', { className: 'form-row' },
      h('label', { className: 'form-label' }, 'Text Color'),
      h('input', {
        className: 'form-color',
        type: 'color',
        value: textColor,
        onChange: (e) => onTextColor(e.target.value)
      })
    ),
    h('div', { className: 'form-row' },
      h('label', { className: 'form-label' }, `Font Size (${textFontSize}px)`),
      h('input', {
        className: 'form-slider',
        type: 'range',
        min: 12,
        max: 200,
        value: textFontSize,
        onChange: (e) => onTextFontSize(Number(e.target.value))
      })
    ),
    h('div', { className: 'form-row' },
      h('label', { className: 'form-label' }, 'Font Family'),
      h('select', {
        className: 'form-select',
        value: textFontFamily,
        onChange: (e) => onTextFontFamily(e.target.value)
      }, FONT_FAMILIES.map((family) => h('option', { value: family }, family)))
    ),
    h('div', { className: 'panel-actions' },
      h('button', { onClick: addText }, 'Add Text Layer')
    )
  );
}

function ImagesPanel({ handleImageUpload }) {
  return h('div', { className: 'sidebar-section' },
    h('h3', null, 'Images'),
    h('div', { className: 'form-row' },
      h('label', { className: 'form-label' }, 'Upload'),
      h('input', {
        className: 'form-input',
        type: 'file',
        accept: 'image/png, image/jpeg, image/svg+xml, image/webp',
        onChange: handleImageUpload
      })
    ),
    h('p', { className: 'form-label' }, 'Select a frame to drop an image inside or place images directly onto the canvas.')
  );
}

function FramesPanel({ addFrame }) {
  return h('div', { className: 'sidebar-section' },
    h('h3', null, 'Frames'),
    h('p', { className: 'form-label' }, 'Pick a frame shape, then insert an image to fill it automatically.'),
    h('div', { className: 'panel-actions grid' },
      FRAME_TYPES.map((frame) => h('button', {
        key: frame.id,
        onClick: () => addFrame(frame.id)
      }, frame.label))
    )
  );
}

function TemplatesPanel({ templates, onCreateTemplate, onApplyTemplate, onOverwriteTemplate, onDeleteTemplate, onRenameTemplate, onSaveToBrowser, onLoadFromBrowser, onClearSaved }) {
  return h('div', null,
    h('div', { className: 'sidebar-section' },
      h('h3', null, 'Templates'),
      h('div', { className: 'panel-actions column' },
        h('button', { onClick: onCreateTemplate }, 'Save current canvas as template'),
        h('button', { onClick: onSaveToBrowser }, 'Save draft to browser'),
        h('button', { onClick: onLoadFromBrowser }, 'Load browser draft'),
        h('button', { className: 'danger', onClick: onClearSaved }, 'Clear browser draft')
      )
    ),
    h('div', { className: 'sidebar-section' },
      h('h3', null, 'Saved templates'),
      templates && templates.length ? h('div', { className: 'template-list' },
        templates.map((template) => h('div', { className: 'template-card', key: template.id },
          template.preview ? h('img', { src: template.preview, alt: template.name || 'Template preview' }) : null,
          h('input', {
            className: 'form-input',
            value: template.name || 'Untitled template',
            onInput: (e) => onRenameTemplate(template.id, e.target.value)
          }),
          h('div', { className: 'panel-actions' },
            h('button', { onClick: () => onApplyTemplate(template.id) }, 'Apply'),
            h('button', { onClick: () => onOverwriteTemplate(template.id) }, 'Update'),
            h('button', { className: 'danger', onClick: () => onDeleteTemplate(template.id) }, 'Delete')
          )
        ))
      ) : h('p', { className: 'empty-panel-message' }, 'Create a template to see it listed here.')
    )
  );
}

function LayersPanel({ layers, onLayerSelect, onLayerVisibility, onLayerLock, onLayerMove, onLayerDelete, onCopySelection, onPasteSelection, onDuplicateSelection, onDeleteSelection }) {
  return h('div', null,
    h('div', { className: 'sidebar-section' },
      h('h3', null, 'Layer actions'),
      h('div', { className: 'panel-actions' },
        h('button', { onClick: onCopySelection }, 'Copy'),
        h('button', { onClick: onPasteSelection }, 'Paste'),
        h('button', { onClick: onDuplicateSelection }, 'Duplicate'),
        h('button', { className: 'danger', onClick: onDeleteSelection }, 'Delete')
      )
    ),
    h('div', { className: 'sidebar-section' },
      h('h3', null, 'Layers'),
      layers && layers.length ? h('ul', { className: 'layer-list' },
        layers.map((layer) => h('li', { key: layer.id, className: 'layer-item' },
          h('button', { className: 'layer-name', onClick: () => onLayerSelect(layer.id) }, layer.label),
          h('div', { className: 'layer-buttons' },
            h('button', { title: layer.visible ? 'Hide layer' : 'Show layer', onClick: () => onLayerVisibility(layer.id) }, layer.visible ? '👁' : '🚫'),
            h('button', { title: layer.locked ? 'Unlock layer' : 'Lock layer', onClick: () => onLayerLock(layer.id) }, layer.locked ? '🔒' : '🔓'),
            h('button', { title: 'Move up', onClick: () => onLayerMove(layer.id, 'up') }, '⬆'),
            h('button', { title: 'Move down', onClick: () => onLayerMove(layer.id, 'down') }, '⬇'),
            h('button', { title: 'To front', onClick: () => onLayerMove(layer.id, 'top') }, '⤴'),
            h('button', { title: 'To back', onClick: () => onLayerMove(layer.id, 'bottom') }, '⤵'),
            h('button', { className: 'danger', title: 'Delete layer', onClick: () => onLayerDelete(layer.id) }, '✕')
          )
        ))
      ) : h('p', { className: 'empty-panel-message' }, 'Layers you add will appear here.')
    )
  );
}

function GuidesPanel({ guides, showRulers, onToggleRulers, onClearGuides, onAddGuide, onRemoveGuide, zoom, onZoomChange, onZoomIn, onZoomOut, onZoomReset, dimensions }) {
  const handleAddGuide = (orientation) => {
    const target = orientation === 'horizontal' ? dimensions.height / 2 : dimensions.width / 2;
    onAddGuide(orientation, target);
  };

  return h('div', null,
    h('div', { className: 'sidebar-section' },
      h('h3', null, 'Rulers & guides'),
      h('div', { className: 'form-row inline' },
        h('label', { className: 'form-label' }, 'Show rulers'),
        h('input', {
          type: 'checkbox',
          checked: showRulers,
          onChange: () => onToggleRulers()
        })
      ),
      h('div', { className: 'panel-actions' },
        h('button', { onClick: () => handleAddGuide('horizontal') }, 'Add horizontal'),
        h('button', { onClick: () => handleAddGuide('vertical') }, 'Add vertical'),
        h('button', { className: 'danger', onClick: onClearGuides }, 'Remove guides')
      )
    ),
    h('div', { className: 'sidebar-section' },
      h('h3', null, 'Zoom'),
      h('div', { className: 'panel-actions' },
        h('button', { onClick: onZoomOut }, `${ICONS.zoomOut}`),
        h('span', { className: 'toolbar-readout' }, `${Math.round(zoom * 100)}%`),
        h('button', { onClick: onZoomIn }, `${ICONS.zoomIn}`),
        h('button', { onClick: onZoomReset }, 'Reset')
      ),
      h('input', {
        type: 'range',
        min: ZOOM_MIN,
        max: ZOOM_MAX,
        step: 0.05,
        value: zoom,
        onInput: (e) => onZoomChange(Number(e.target.value)),
        className: 'form-slider'
      })
    ),
    h('div', { className: 'sidebar-section' },
      h('h3', null, 'Active guides'),
      guides && guides.length ? h('ul', { className: 'guide-list' },
        guides.map((guide) => h('li', { key: guide.id, className: 'guide-item' },
          h('span', null, `${guide.orientation === 'vertical' ? 'Vertical' : 'Horizontal'} – ${Math.round(guide.position)}px`),
          h('button', { className: 'danger', onClick: () => onRemoveGuide(guide.id) }, 'Remove')
        ))
      ) : h('p', { className: 'empty-panel-message' }, 'Use the rulers or buttons above to create guides.')
    )
  );
}

function Rulers({ width, height, zoom, onPointerDown }) {
  const horizontalTicks = [];
  const verticalTicks = [];
  for (let x = 0; x <= width; x += 50) {
    horizontalTicks.push(x);
  }
  for (let y = 0; y <= height; y += 50) {
    verticalTicks.push(y);
  }

  return h('div', { className: 'ruler-layer' },
    h('div', { className: 'ruler horizontal', onPointerDown: (event) => onPointerDown('horizontal', event) },
      horizontalTicks.map((value) => h('span', {
        key: value,
        className: 'ruler-tick',
        style: { left: `${value * zoom + RULER_SIZE}px` }
      }, value)
      )
    ),
    h('div', { className: 'ruler vertical', onPointerDown: (event) => onPointerDown('vertical', event) },
      verticalTicks.map((value) => h('span', {
        key: value,
        className: 'ruler-tick',
        style: { top: `${value * zoom + RULER_SIZE}px` }
      }, value)
      )
    )
  );
}

function GuideOverlay({ guides, zoom, onPointerDown, onRemove }) {
  if (!guides || !guides.length) {
    return null;
  }

  return h('div', { className: 'guide-overlay' },
    guides.map((guide) => h('div', {
      key: guide.id,
      className: `guide-line ${guide.orientation}`,
      style: guide.orientation === 'vertical'
        ? { left: `${RULER_SIZE + guide.position * zoom}px` }
        : { top: `${RULER_SIZE + guide.position * zoom}px` },
      onPointerDown: (event) => onPointerDown(guide, event),
      onDoubleClick: () => onRemove(guide.id)
    }))
  );
}

function ToastList({ toasts, onDismiss }) {
  return h('div', { className: 'toast-container' },
    toasts.map((toast) => h('div', {
      key: toast.id,
      className: `toast toast-${toast.tone}`
    },
      h('span', null, toast.message),
      h('button', { onClick: () => onDismiss(toast.id) }, '×')
    ))
  );
}

function BackgroundPanel({ dimensions, onDimensionsChange, backgroundColor, onBackgroundColor }) {
  const updateDimension = (key, value) => {
    const numeric = clamp(Number(value) || INITIAL_DIMENSIONS[key], 100, 4000);
    onDimensionsChange({ ...dimensions, [key]: numeric });
  };

  return h('div', null,
    h('div', { className: 'sidebar-section' },
      h('h3', null, 'Canvas Size'),
      h('div', { className: 'dimension-inputs' },
        h('div', { className: 'form-row' },
          h('label', { className: 'form-label' }, 'Width'),
          h('input', {
            className: 'form-input',
            type: 'number',
            min: 100,
            max: 4000,
            value: dimensions.width,
            onChange: (e) => updateDimension('width', e.target.value)
          })
        ),
        h('div', { className: 'form-row' },
          h('label', { className: 'form-label' }, 'Height'),
          h('input', {
            className: 'form-input',
            type: 'number',
            min: 100,
            max: 4000,
            value: dimensions.height,
            onChange: (e) => updateDimension('height', e.target.value)
          })
        )
      )
    ),
    h('div', { className: 'sidebar-section' },
      h('h3', null, 'Background'),
      h('div', { className: 'form-row' },
        h('label', { className: 'form-label' }, 'Color'),
        h('input', {
          className: 'form-color',
          type: 'color',
          value: backgroundColor,
          onChange: (e) => onBackgroundColor(e.target.value)
        })
      )
    )
  );
}

function SelectionPanel({ selection, applySelectionChange }) {
  if (!selection) {
    return h('p', { className: 'empty-panel-message' }, 'Select an element on the canvas to edit its properties.');
  }

  const controls = [];

  if (selection.fill != null) {
    controls.push(
      h('div', { className: 'form-row' },
        h('label', { className: 'form-label' }, 'Fill Color'),
        h('input', {
          className: 'form-color',
          type: 'color',
          value: selection.fill,
          onChange: (e) => applySelectionChange({ fill: e.target.value })
        })
      )
    );
  }

  if (selection.stroke != null) {
    controls.push(
      h('div', { className: 'form-row' },
        h('label', { className: 'form-label' }, 'Stroke Color'),
        h('input', {
          className: 'form-color',
          type: 'color',
          value: selection.stroke,
          onChange: (e) => applySelectionChange({ stroke: e.target.value })
        })
      )
    );
  }

  if (selection.strokeWidth != null) {
    controls.push(
      h('div', { className: 'form-row' },
        h('label', { className: 'form-label' }, `Stroke Width (${selection.strokeWidth}px)`),
        h('input', {
          className: 'form-slider',
          type: 'range',
          min: 0,
          max: 60,
          value: selection.strokeWidth,
          onChange: (e) => applySelectionChange({ strokeWidth: Number(e.target.value) })
        })
      )
    );
  }

  controls.push(
    h('div', { className: 'form-row' },
      h('label', { className: 'form-label' }, `Opacity (${Math.round(selection.opacity * 100)}%)`),
      h('input', {
        className: 'form-slider',
        type: 'range',
        min: 10,
        max: 100,
        value: Math.round(selection.opacity * 100),
        onChange: (e) => applySelectionChange({ opacity: Number(e.target.value) / 100 })
      })
    )
  );

  if (typeof selection.text === 'string') {
    controls.push(
      h('div', { className: 'form-row' },
        h('label', { className: 'form-label' }, 'Text Content'),
        h('textarea', {
          className: 'form-input',
          value: selection.text,
          onInput: (e) => applySelectionChange({ text: e.target.value })
        })
      ),
      h('div', { className: 'form-row' },
        h('label', { className: 'form-label' }, `Font Size (${selection.fontSize || 0}px)`),
        h('input', {
          className: 'form-slider',
          type: 'range',
          min: 10,
          max: 220,
          value: selection.fontSize || 32,
          onChange: (e) => applySelectionChange({ fontSize: Number(e.target.value) })
        })
      ),
      h('div', { className: 'form-row' },
        h('label', { className: 'form-label' }, 'Font Family'),
        h('select', {
          className: 'form-select',
          value: selection.fontFamily || FONT_FAMILIES[0],
          onChange: (e) => applySelectionChange({ fontFamily: e.target.value })
        }, FONT_FAMILIES.map((family) => h('option', { value: family }, family)))
      )
    );
  }

  return h('div', { className: 'sidebar-section' },
    h('h3', null, 'Selection'),
    h('div', { className: 'selection-info' },
      h('div', null, h('strong', null, 'Type: '), selection.type || 'object'),
      h('div', null, h('strong', null, 'Size: '), `${selection.width || 0}px × ${selection.height || 0}px`),
      h('div', null, h('strong', null, 'Rotation: '), `${Math.round(selection.angle || 0)}°`)
    ),
    controls
  );
}

ReactDOM.render(h(EditorApp), document.getElementById('image-editor-container'));
})(typeof window !== 'undefined' ? window : globalThis);
