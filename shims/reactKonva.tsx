import Konva from 'konva';
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
  type PropsWithChildren,
} from 'react';

const EVENT_MAP: Record<string, string> = {
  onMouseDown: 'mousedown',
  onMouseMove: 'mousemove',
  onMouseUp: 'mouseup',
  onMouseEnter: 'mouseenter',
  onMouseLeave: 'mouseleave',
  onMouseOver: 'mouseover',
  onMouseOut: 'mouseout',
  onTouchStart: 'touchstart',
  onTouchMove: 'touchmove',
  onTouchEnd: 'touchend',
  onClick: 'click',
  onDblClick: 'dblclick',
  onTap: 'tap',
  onDblTap: 'dbltap',
  onDragStart: 'dragstart',
  onDragMove: 'dragmove',
  onDragEnd: 'dragend',
  onTransformStart: 'transformstart',
  onTransform: 'transform',
  onTransformEnd: 'transformend',
  onWheel: 'wheel',
  onContextMenu: 'contextmenu',
};

const RESERVED_PROPS = new Set(['children', 'ref', 'key', 'style', 'className']);

function filterProps(props: Record<string, any> | undefined): Record<string, any> {
  const next: Record<string, any> = {};
  if (!props) return next;
  for (const key of Object.keys(props)) {
    if (RESERVED_PROPS.has(key)) continue;
    const value = props[key];
    if (value === undefined) continue;
    next[key] = value;
  }
  return next;
}

function filterConfig(props: Record<string, any> | undefined): Record<string, any> {
  const next: Record<string, any> = {};
  if (!props) return next;
  for (const key of Object.keys(props)) {
    if (EVENT_MAP[key] || RESERVED_PROPS.has(key)) continue;
    const value = props[key];
    if (value === undefined) continue;
    next[key] = value;
  }
  return next;
}

function applyNodeProps(node: Konva.Node, newProps: Record<string, any>, oldProps: Record<string, any>) {
  for (const key of Object.keys(oldProps)) {
    if (EVENT_MAP[key]) {
      const handler = oldProps[key];
      const nextHandler = newProps[key];
      if (handler && handler !== nextHandler) {
        node.off(EVENT_MAP[key], handler);
      }
    }
  }

  for (const key of Object.keys(newProps)) {
    const value = newProps[key];
    if (EVENT_MAP[key]) {
      const oldHandler = oldProps[key];
      if (value !== oldHandler) {
        if (oldHandler) {
          node.off(EVENT_MAP[key], oldHandler);
        }
        if (value) {
          node.on(EVENT_MAP[key], value);
        }
      }
      continue;
    }

    const previous = oldProps[key];
    if (value !== previous) {
      try {
        node.setAttr(key, value);
      } catch (error) {
        // Ignore attempts to set unsupported attributes to keep parity with react-konva behaviour
      }
    }
  }

  for (const key of Object.keys(oldProps)) {
    if (EVENT_MAP[key] || key in newProps) continue;
    try {
      node.setAttr(key, undefined);
    } catch (error) {
      // Ignore cleanup failures
    }
  }

  const batchDraw = (node as unknown as { batchDraw?: () => void }).batchDraw;
  if (typeof batchDraw === 'function') {
    batchDraw.call(node);
  } else {
    node.getLayer()?.batchDraw();
  }
}

const KonvaParentContext = createContext<Konva.Stage | Konva.Container | null>(null);

function useKonvaParent() {
  const parent = useContext(KonvaParentContext);
  if (!parent) {
    throw new Error('Konva nodes must be rendered inside a Stage or Layer.');
  }
  return parent;
}

type StageProps = PropsWithChildren<Record<string, any>> & {
  style?: CSSProperties;
  className?: string;
};

export const Stage = forwardRef<Konva.Stage | null, StageProps>((props, forwardedRef) => {
  const { children, style, className, ...rest } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const prevPropsRef = useRef<Record<string, any>>({});
  const [ready, setReady] = useState(false);

  useImperativeHandle(
    forwardedRef,
    () => {
      return stageRef.current;
    },
    [ready],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const config = filterConfig(rest);
    const stage = new Konva.Stage({ container, ...config });
    stageRef.current = stage;
    const initialProps = filterProps(rest);
    prevPropsRef.current = initialProps;
    applyNodeProps(stage, initialProps, {});
    setReady(true);
    return () => {
      stage.destroy();
      stageRef.current = null;
      prevPropsRef.current = {};
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const newProps = filterProps(rest);
    applyNodeProps(stage, newProps, prevPropsRef.current);
    prevPropsRef.current = newProps;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (className !== undefined) {
      container.className = className;
    }
    if (style) {
      Object.assign(container.style, style);
    }
  }, [className, style]);

  return (
    <KonvaParentContext.Provider value={ready ? stageRef.current : null}>
      <div ref={containerRef} />
      {ready ? children : null}
    </KonvaParentContext.Provider>
  );
});

Stage.displayName = 'Stage';

type LayerProps = PropsWithChildren<Record<string, any>>;

export const Layer = forwardRef<Konva.Layer | null, LayerProps>(({ children, ...rest }, forwardedRef) => {
  const parent = useKonvaParent();
  const layerRef: MutableRefObject<Konva.Layer | null> = useRef<Konva.Layer | null>(null);
  const prevPropsRef = useRef<Record<string, any>>({});
  const [ready, setReady] = useState(false);

  useImperativeHandle(
    forwardedRef,
    () => {
      return layerRef.current;
    },
    [ready],
  );

  useEffect(() => {
    const layer = new Konva.Layer(filterConfig(rest));
    layerRef.current = layer;
    (parent as any).add(layer);
    const initialProps = filterProps(rest);
    prevPropsRef.current = initialProps;
    applyNodeProps(layer, initialProps, {});
    setReady(true);
    return () => {
      layer.destroy();
      layerRef.current = null;
      prevPropsRef.current = {};
      setReady(false);
    };
  }, [parent]);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const newProps = filterProps(rest);
    applyNodeProps(layer, newProps, prevPropsRef.current);
    prevPropsRef.current = newProps;
  });

  if (!ready) {
    return null;
  }

  return (
    <KonvaParentContext.Provider value={layerRef.current}>{children}</KonvaParentContext.Provider>
  );
});

Layer.displayName = 'Layer';

type NodeProps = Record<string, any>;

type NodeFactory<T extends Konva.Node> = () => T;

function createKonvaComponent<T extends Konva.Node>(factory: NodeFactory<T>) {
  const Component = forwardRef<T | null, NodeProps>((props, forwardedRef) => {
    const parent = useKonvaParent();
    const nodeRef: MutableRefObject<T | null> = useRef<T | null>(null);
    const prevPropsRef = useRef<Record<string, any>>({});
    const [ready, setReady] = useState(false);

    useImperativeHandle(
      forwardedRef,
      () => {
        return nodeRef.current;
      },
      [ready],
    );

    useEffect(() => {
      const node = factory();
      nodeRef.current = node;
      (parent as any).add(node);
      const initialProps = filterProps(props);
      prevPropsRef.current = initialProps;
      applyNodeProps(node, initialProps, {});
      setReady(true);
      return () => {
        (node as any).destroy?.();
        nodeRef.current = null;
        prevPropsRef.current = {};
        setReady(false);
      };
    }, [parent]);

    useEffect(() => {
      const node = nodeRef.current;
      if (!node) return;
      const newProps = filterProps(props);
      applyNodeProps(node, newProps, prevPropsRef.current);
      prevPropsRef.current = newProps;
    });

    return null;
  });

  return Component;
}

export const Rect = createKonvaComponent(() => new Konva.Rect());
export const Circle = createKonvaComponent(() => new Konva.Circle());
export const Ellipse = createKonvaComponent(() => new Konva.Ellipse());
export const Line = createKonvaComponent(() => new Konva.Line());
export const RegularPolygon = createKonvaComponent(() => new Konva.RegularPolygon({ sides: 3, radius: 0 }));
export const Text = createKonvaComponent(() => new Konva.Text());
export const Transformer = createKonvaComponent(() => new Konva.Transformer());
export const Image = createKonvaComponent(() => new Konva.Image());
export const Group = createKonvaComponent(() => new Konva.Group());
