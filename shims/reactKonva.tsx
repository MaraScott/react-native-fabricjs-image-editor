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

/**
 * Set - Auto-generated summary; refine if additional context is needed.
 *
 * @param {*} ['children' - Parameter derived from the static analyzer.
 * @param {*} 'ref' - Parameter derived from the static analyzer.
 * @param {*} 'key' - Parameter derived from the static analyzer.
 * @param {*} 'style' - Parameter derived from the static analyzer.
 * @param {*} 'className'] - Parameter derived from the static analyzer.
 *
 * @returns {['children', 'ref', 'key', 'style', 'className']} Refer to the implementation for the precise returned value.
 */
/**
 * Set - Auto-generated documentation stub.
 *
 * @param {*} ['children' - Parameter forwarded to Set.
 * @param {*} 'ref' - Parameter forwarded to Set.
 * @param {*} 'key' - Parameter forwarded to Set.
 * @param {*} 'style' - Parameter forwarded to Set.
 * @param {*} 'className'] - Parameter forwarded to Set.
 *
 * @returns {['children', 'ref', 'key', 'style', 'className']} Result produced by Set.
 */
const RESERVED_PROPS = new Set(['children', 'ref', 'key', 'style', 'className']);

function filterProps(props: Record<string, any> | undefined): Record<string, any> {
  const next: Record<string, any> = {};
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {!props} Refer to the implementation for the precise returned value.
   */
  /**
   * if - Auto-generated documentation stub.
   *
   * @returns {!props} Result produced by if.
   */
  if (!props) return next;
  /**
   * for - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * for - Auto-generated documentation stub.
   */
  for (const key of Object.keys(props)) {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (RESERVED_PROPS.has(key)) continue;
    const value = props[key];
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (value === undefined) continue;
    next[key] = value;
  }
  return next;
}

/**
 * filterConfig - Auto-generated summary; refine if additional context is needed.
 *
 * @param {*} props - Parameter derived from the static analyzer.
 * @param {*} any> | undefined - Parameter derived from the static analyzer.
 *
 * @returns {Record<string, any>} Refer to the implementation for the precise returned value.
 */
/**
 * filterConfig - Auto-generated documentation stub.
 *
 * @param {*} props - Parameter forwarded to filterConfig.
 * @param {*} any> | undefined - Parameter forwarded to filterConfig.
 *
 * @returns {Record<string, any>} Result produced by filterConfig.
 */
function filterConfig(props: Record<string, any> | undefined): Record<string, any> {
  const next: Record<string, any> = {};
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {!props} Refer to the implementation for the precise returned value.
   */
  /**
   * if - Auto-generated documentation stub.
   *
   * @returns {!props} Result produced by if.
   */
  if (!props) return next;
  /**
   * for - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * for - Auto-generated documentation stub.
   */
  for (const key of Object.keys(props)) {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (EVENT_MAP[key] || RESERVED_PROPS.has(key)) continue;
    const value = props[key];
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (value === undefined) continue;
    next[key] = value;
  }
  return next;
}

function applyNodeProps(node: Konva.Node, newProps: Record<string, any>, oldProps: Record<string, any>) {
  /**
   * for - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * for - Auto-generated documentation stub.
   */
  for (const key of Object.keys(oldProps)) {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {EVENT_MAP[key]} Refer to the implementation for the precise returned value.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {EVENT_MAP[key]} Result produced by if.
     */
    if (EVENT_MAP[key]) {
      const handler = oldProps[key];
      const nextHandler = newProps[key];
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (handler && handler !== nextHandler) {
        /**
         * off - Auto-generated summary; refine if additional context is needed.
         *
         * @param {*} EVENT_MAP[key] - Parameter derived from the static analyzer.
         * @param {*} handler - Parameter derived from the static analyzer.
         *
         * @returns {EVENT_MAP[key], handler} Refer to the implementation for the precise returned value.
         */
        /**
         * off - Auto-generated documentation stub.
         *
         * @param {*} EVENT_MAP[key] - Parameter forwarded to off.
         * @param {*} handler - Parameter forwarded to off.
         *
         * @returns {EVENT_MAP[key], handler} Result produced by off.
         */
        node.off(EVENT_MAP[key], handler);
      }
    }
  }

  /**
   * for - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * for - Auto-generated documentation stub.
   */
  for (const key of Object.keys(newProps)) {
    const value = newProps[key];
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {EVENT_MAP[key]} Refer to the implementation for the precise returned value.
     */
    if (EVENT_MAP[key]) {
      const oldHandler = oldProps[key];
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      if (value !== oldHandler) {
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {oldHandler} Refer to the implementation for the precise returned value.
         */
        /**
         * if - Auto-generated documentation stub.
         *
         * @returns {oldHandler} Result produced by if.
         */
        if (oldHandler) {
          /**
           * off - Auto-generated summary; refine if additional context is needed.
           *
           * @param {*} EVENT_MAP[key] - Parameter derived from the static analyzer.
           * @param {*} oldHandler - Parameter derived from the static analyzer.
           *
           * @returns {EVENT_MAP[key], oldHandler} Refer to the implementation for the precise returned value.
           */
          /**
           * off - Auto-generated documentation stub.
           *
           * @param {*} EVENT_MAP[key] - Parameter forwarded to off.
           * @param {*} oldHandler - Parameter forwarded to off.
           *
           * @returns {EVENT_MAP[key], oldHandler} Result produced by off.
           */
          node.off(EVENT_MAP[key], oldHandler);
        }
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {value} Refer to the implementation for the precise returned value.
         */
        /**
         * if - Auto-generated documentation stub.
         *
         * @returns {value} Result produced by if.
         */
        if (value) {
          /**
           * on - Auto-generated summary; refine if additional context is needed.
           *
           * @param {*} EVENT_MAP[key] - Parameter derived from the static analyzer.
           * @param {*} value - Parameter derived from the static analyzer.
           *
           * @returns {EVENT_MAP[key], value} Refer to the implementation for the precise returned value.
           */
          /**
           * on - Auto-generated documentation stub.
           *
           * @param {*} EVENT_MAP[key] - Parameter forwarded to on.
           * @param {*} value - Parameter forwarded to on.
           *
           * @returns {EVENT_MAP[key], value} Result produced by on.
           */
          node.on(EVENT_MAP[key], value);
        }
      }
      continue;
    }

    const previous = oldProps[key];
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (value !== previous) {
      try {
        /**
         * setAttr - Auto-generated summary; refine if additional context is needed.
         *
         * @param {*} key - Parameter derived from the static analyzer.
         * @param {*} value - Parameter derived from the static analyzer.
         *
         * @returns {key, value} Refer to the implementation for the precise returned value.
         */
        /**
         * setAttr - Auto-generated documentation stub.
         *
         * @param {*} key - Parameter forwarded to setAttr.
         * @param {*} value - Parameter forwarded to setAttr.
         *
         * @returns {key, value} Result produced by setAttr.
         */
        node.setAttr(key, value);
      /**
       * catch - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {error} Refer to the implementation for the precise returned value.
       */
      /**
       * catch - Auto-generated documentation stub.
       *
       * @returns {error} Result produced by catch.
       */
      } catch (error) {
        // Ignore attempts to set unsupported attributes to keep parity with react-konva behaviour
      }
    }
  }

  /**
   * for - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * for - Auto-generated documentation stub.
   */
  for (const key of Object.keys(oldProps)) {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {EVENT_MAP[key] || key in newProps} Refer to the implementation for the precise returned value.
     */
    if (EVENT_MAP[key] || key in newProps) continue;
    try {
      /**
       * setAttr - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} key - Parameter derived from the static analyzer.
       * @param {*} undefined - Parameter derived from the static analyzer.
       *
       * @returns {key, undefined} Refer to the implementation for the precise returned value.
       */
      /**
       * setAttr - Auto-generated documentation stub.
       *
       * @param {*} key - Parameter forwarded to setAttr.
       * @param {*} undefined - Parameter forwarded to setAttr.
       *
       * @returns {key, undefined} Result produced by setAttr.
       */
      node.setAttr(key, undefined);
    /**
     * catch - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {error} Refer to the implementation for the precise returned value.
     */
    /**
     * catch - Auto-generated documentation stub.
     *
     * @returns {error} Result produced by catch.
     */
    } catch (error) {
      // Ignore cleanup failures
    }
  }

  /**
   * batchDraw - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * batchDraw - Auto-generated documentation stub.
   */
  const batchDraw = (node as unknown as { batchDraw?: () => void }).batchDraw;
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * if - Auto-generated documentation stub.
   */
  if (typeof batchDraw === 'function') {
    /**
     * call - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {node} Refer to the implementation for the precise returned value.
     */
    /**
     * call - Auto-generated documentation stub.
     *
     * @returns {node} Result produced by call.
     */
    batchDraw.call(node);
  } else {
    /**
     * getLayer - Auto-generated summary; refine if additional context is needed.
     */
    node.getLayer()?.batchDraw();
  }
}

const KonvaParentContext = createContext<Konva.Stage | Konva.Container | null>(null);

/**
 * useKonvaParent - Auto-generated summary; refine if additional context is needed.
 */
/**
 * useKonvaParent - Auto-generated documentation stub.
 */
function useKonvaParent() {
  /**
   * useContext - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {KonvaParentContext} Refer to the implementation for the precise returned value.
   */
  const parent = useContext(KonvaParentContext);
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {!parent} Refer to the implementation for the precise returned value.
   */
  /**
   * if - Auto-generated documentation stub.
   *
   * @returns {!parent} Result produced by if.
   */
  if (!parent) {
    /**
     * Error - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {'Konva nodes must be rendered inside a Stage or Layer.'} Refer to the implementation for the precise returned value.
     */
    /**
     * Error - Auto-generated documentation stub.
     *
     * @returns {'Konva nodes must be rendered inside a Stage or Layer.'} Result produced by Error.
     */
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
  /**
   * useState - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {false} Refer to the implementation for the precise returned value.
   */
  /**
   * useState - Auto-generated documentation stub.
   *
   * @returns {false} Result produced by useState.
   */
  const [ready, setReady] = useState(false);

  useImperativeHandle(
    forwardedRef,
    () => {
      return stageRef.current;
    },
    [ready],
  );

  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   */
  useEffect(() => {
    const container = containerRef.current;
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!container} Refer to the implementation for the precise returned value.
     */
    if (!container) return;
    /**
     * filterConfig - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {rest} Refer to the implementation for the precise returned value.
     */
    /**
     * filterConfig - Auto-generated documentation stub.
     *
     * @returns {rest} Result produced by filterConfig.
     */
    const config = filterConfig(rest);
    /**
     * Stage - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} { container - Parameter derived from the static analyzer.
     * @param {*} ...config } - Parameter derived from the static analyzer.
     *
     * @returns {{ container, ...config }} Refer to the implementation for the precise returned value.
     */
    /**
     * Stage - Auto-generated documentation stub.
     *
     * @param {*} { container - Parameter forwarded to Stage.
     * @param {*} ...config } - Parameter forwarded to Stage.
     *
     * @returns {{ container, ...config }} Result produced by Stage.
     */
    const stage = new Konva.Stage({ container, ...config });
    stageRef.current = stage;
    const initialProps = filterProps(rest);
    prevPropsRef.current = initialProps;
    applyNodeProps(stage, initialProps, {});
    /**
     * setReady - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {true} Refer to the implementation for the precise returned value.
     */
    /**
     * setReady - Auto-generated documentation stub.
     *
     * @returns {true} Result produced by setReady.
     */
    setReady(true);
    /**
     * return - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * return - Auto-generated documentation stub.
     */
    return () => {
      /**
       * destroy - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * destroy - Auto-generated documentation stub.
       */
      stage.destroy();
      stageRef.current = null;
      prevPropsRef.current = {};
      /**
       * setReady - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {false} Refer to the implementation for the precise returned value.
       */
      /**
       * setReady - Auto-generated documentation stub.
       *
       * @returns {false} Result produced by setReady.
       */
      setReady(false);
    };
  }, []);

  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   */
  useEffect(() => {
    const stage = stageRef.current;
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!stage} Refer to the implementation for the precise returned value.
     */
    if (!stage) return;
    const newProps = filterProps(rest);
    applyNodeProps(stage, newProps, prevPropsRef.current);
    prevPropsRef.current = newProps;
  });

  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   */
  useEffect(() => {
    const container = containerRef.current;
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!container} Refer to the implementation for the precise returned value.
     */
    if (!container) return;
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (className !== undefined) {
      container.className = className;
    }
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {style} Refer to the implementation for the precise returned value.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {style} Result produced by if.
     */
    if (style) {
      /**
       * assign - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} container.style - Parameter derived from the static analyzer.
       * @param {*} style - Parameter derived from the static analyzer.
       *
       * @returns {container.style, style} Refer to the implementation for the precise returned value.
       */
      /**
       * assign - Auto-generated documentation stub.
       *
       * @param {*} container.style - Parameter forwarded to assign.
       * @param {*} style - Parameter forwarded to assign.
       *
       * @returns {container.style, style} Result produced by assign.
       */
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
  /**
   * useKonvaParent - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useKonvaParent - Auto-generated documentation stub.
   */
  const parent = useKonvaParent();
  const layerRef: MutableRefObject<Konva.Layer | null> = useRef<Konva.Layer | null>(null);
  const prevPropsRef = useRef<Record<string, any>>({});
  /**
   * useState - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {false} Refer to the implementation for the precise returned value.
   */
  /**
   * useState - Auto-generated documentation stub.
   *
   * @returns {false} Result produced by useState.
   */
  const [ready, setReady] = useState(false);

  useImperativeHandle(
    forwardedRef,
    () => {
      return layerRef.current;
    },
    [ready],
  );

  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   */
  useEffect(() => {
    /**
     * Layer - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * Layer - Auto-generated documentation stub.
     */
    const layer = new Konva.Layer(filterConfig(rest));
    layerRef.current = layer;
    /**
     * add - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {layer} Refer to the implementation for the precise returned value.
     */
    (parent as any).add(layer);
    const initialProps = filterProps(rest);
    prevPropsRef.current = initialProps;
    applyNodeProps(layer, initialProps, {});
    /**
     * setReady - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {true} Refer to the implementation for the precise returned value.
     */
    /**
     * setReady - Auto-generated documentation stub.
     *
     * @returns {true} Result produced by setReady.
     */
    setReady(true);
    /**
     * return - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * return - Auto-generated documentation stub.
     */
    return () => {
      /**
       * destroy - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * destroy - Auto-generated documentation stub.
       */
      layer.destroy();
      layerRef.current = null;
      prevPropsRef.current = {};
      /**
       * setReady - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {false} Refer to the implementation for the precise returned value.
       */
      /**
       * setReady - Auto-generated documentation stub.
       *
       * @returns {false} Result produced by setReady.
       */
      setReady(false);
    };
  }, [parent]);

  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   */
  useEffect(() => {
    const layer = layerRef.current;
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!layer} Refer to the implementation for the precise returned value.
     */
    if (!layer) return;
    const newProps = filterProps(rest);
    applyNodeProps(layer, newProps, prevPropsRef.current);
    prevPropsRef.current = newProps;
  });

  /**
   * if - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {!ready} Refer to the implementation for the precise returned value.
   */
  /**
   * if - Auto-generated documentation stub.
   *
   * @returns {!ready} Result produced by if.
   */
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
    /**
     * useKonvaParent - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * useKonvaParent - Auto-generated documentation stub.
     */
    const parent = useKonvaParent();
    const nodeRef: MutableRefObject<T | null> = useRef<T | null>(null);
    const prevPropsRef = useRef<Record<string, any>>({});
    /**
     * useState - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {false} Refer to the implementation for the precise returned value.
     */
    /**
     * useState - Auto-generated documentation stub.
     *
     * @returns {false} Result produced by useState.
     */
    const [ready, setReady] = useState(false);

    useImperativeHandle(
      forwardedRef,
      () => {
        return nodeRef.current;
      },
      [ready],
    );

    /**
     * useEffect - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * useEffect - Auto-generated documentation stub.
     */
    useEffect(() => {
      /**
       * factory - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * factory - Auto-generated documentation stub.
       */
      const node = factory();
      nodeRef.current = node;
      /**
       * add - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {node} Refer to the implementation for the precise returned value.
       */
      (parent as any).add(node);
      const initialProps = filterProps(props);
      prevPropsRef.current = initialProps;
      applyNodeProps(node, initialProps, {});
      /**
       * setReady - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {true} Refer to the implementation for the precise returned value.
       */
      /**
       * setReady - Auto-generated documentation stub.
       *
       * @returns {true} Result produced by setReady.
       */
      setReady(true);
      /**
       * return - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * return - Auto-generated documentation stub.
       */
      return () => {
        (node as any).destroy?.();
        nodeRef.current = null;
        prevPropsRef.current = {};
        /**
         * setReady - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {false} Refer to the implementation for the precise returned value.
         */
        /**
         * setReady - Auto-generated documentation stub.
         *
         * @returns {false} Result produced by setReady.
         */
        setReady(false);
      };
    }, [parent]);

    /**
     * useEffect - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * useEffect - Auto-generated documentation stub.
     */
    useEffect(() => {
      const node = nodeRef.current;
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {!node} Refer to the implementation for the precise returned value.
       */
      if (!node) return;
      const newProps = filterProps(props);
      applyNodeProps(node, newProps, prevPropsRef.current);
      prevPropsRef.current = newProps;
    });

    return null;
  });

  return Component;
}

/**
 * createKonvaComponent - Auto-generated summary; refine if additional context is needed.
 */
/**
 * createKonvaComponent - Auto-generated documentation stub.
 */
export const Rect = createKonvaComponent(() => new Konva.Rect());
/**
 * createKonvaComponent - Auto-generated summary; refine if additional context is needed.
 */
/**
 * createKonvaComponent - Auto-generated documentation stub.
 */
export const Circle = createKonvaComponent(() => new Konva.Circle());
/**
 * createKonvaComponent - Auto-generated summary; refine if additional context is needed.
 */
/**
 * createKonvaComponent - Auto-generated documentation stub.
 */
export const Ellipse = createKonvaComponent(() => new Konva.Ellipse());
/**
 * createKonvaComponent - Auto-generated summary; refine if additional context is needed.
 */
/**
 * createKonvaComponent - Auto-generated documentation stub.
 */
export const Line = createKonvaComponent(() => new Konva.Line());
/**
 * createKonvaComponent - Auto-generated summary; refine if additional context is needed.
 */
/**
 * createKonvaComponent - Auto-generated documentation stub.
 */
export const RegularPolygon = createKonvaComponent(() => new Konva.RegularPolygon({ sides: 3, radius: 0 }));
/**
 * createKonvaComponent - Auto-generated summary; refine if additional context is needed.
 */
/**
 * createKonvaComponent - Auto-generated documentation stub.
 */
export const Text = createKonvaComponent(() => new Konva.Text());
/**
 * createKonvaComponent - Auto-generated summary; refine if additional context is needed.
 */
/**
 * createKonvaComponent - Auto-generated documentation stub.
 */
export const Transformer = createKonvaComponent(() => new Konva.Transformer());
/**
 * createKonvaComponent - Auto-generated summary; refine if additional context is needed.
 */
/**
 * createKonvaComponent - Auto-generated documentation stub.
 */
export const Image = createKonvaComponent(() => new Konva.Image());
/**
 * createKonvaComponent - Auto-generated summary; refine if additional context is needed.
 */
/**
 * createKonvaComponent - Auto-generated documentation stub.
 */
export const Group = createKonvaComponent(() => new Konva.Group());
