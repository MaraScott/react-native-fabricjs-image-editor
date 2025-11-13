/**
 * Atomic Design - Organism: CanvasContainer
 * Full-featured canvas container with state management, zoom controls, and layer panel
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { SimpleCanvas } from '@molecules/Canvas';
import type {
  LayerDescriptor,
  LayerControlHandlers
} from '@molecules/Canvas';
import type Konva from 'konva';

/**
 * CanvasLayerDefinition interface - Auto-generated interface summary; customize as needed.
 */
/**
 * CanvasLayerDefinition interface - Generated documentation block.
 */
export interface CanvasLayerDefinition {
  id?: string;
  name: string;
  visible?: boolean;
  position?: { x: number; y: number };
  rotation?: number;
  scale?: { x: number; y: number };
  render: () => ReactNode;
}

/**
 * CanvasContainerProps interface - Auto-generated interface summary; customize as needed.
 */
/**
 * CanvasContainerProps interface - Generated documentation block.
 */
export interface CanvasContainerProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
  containerBackground?: string;
  zoom?: number;
  children?: ReactNode;
  onStageReady?: (stage: Konva.Stage) => void;
  onZoomChange?: (zoom: number) => void;
  panModeActive?: boolean;
  initialLayers?: CanvasLayerDefinition[];
  selectModeActive?: boolean;
}

const generateLayerId = (): string => {
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * if - Auto-generated documentation stub.
   */
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    /**
     * randomUUID - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * randomUUID - Auto-generated documentation stub.
     */
    return crypto.randomUUID();
  }

  /**
   * random - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * random - Auto-generated documentation stub.
   */
  return `layer-${Math.random().toString(36).slice(2, 11)}`;
};

const normaliseLayerDefinitions = (
  definitions: CanvasLayerDefinition[]
): LayerDescriptor[] => {
  /**
   * map - Auto-generated summary; refine if additional context is needed.
   *
   * @param {*} (definition - Parameter derived from the static analyzer.
   * @param {*} index - Parameter derived from the static analyzer.
   */
  /**
   * map - Auto-generated documentation stub.
   *
   * @param {*} (definition - Parameter forwarded to map.
   * @param {*} index - Parameter forwarded to map.
   */
  return definitions.map((definition, index) => ({
    /**
     * generateLayerId - Auto-generated summary; refine if additional context is needed.
     */
    id: definition.id ?? generateLayerId(),
    name: definition.name ?? `Layer ${index + 1}`,
    visible: definition.visible ?? true,
    position: definition.position ?? { x: 0, y: 0 },
    rotation: definition.rotation ?? 0,
    scale: definition.scale ?? { x: 1, y: 1 },
    render: definition.render,
  }));
};

const areSelectionsEqual = (first: string[], second: string[]): boolean => {
  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * if - Auto-generated documentation stub.
   */
  if (first === second) {
    return true;
  }

  /**
   * if - Auto-generated summary; refine if additional context is needed.
   */
  if (first.length !== second.length) {
    return false;
  }

  /**
   * for - Auto-generated summary; refine if additional context is needed.
   */
  for (let index = 0; index < first.length; index += 1) {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (first[index] !== second[index]) {
      return false;
    }
  }

  return true;
};

/**
 * CanvasContainer Organism - Main canvas component with full functionality
 * Manages canvas state, zoom, and high-level layer operations for the canvas
 */
export const CanvasContainer = ({
  width = 1024,
  height = 1024,
  backgroundColor = '#ffffff',
  containerBackground = '#cccccc',
  zoom = 0,
  children,
  onStageReady,
  onZoomChange,
  panModeActive = false,
  initialLayers,
  selectModeActive = false,
}: CanvasContainerProps) => {
  const [, setStage] = useState<Konva.Stage | null>(null);
  /**
   * useState - Auto-generated summary; refine if additional context is needed.
   *
   * @returns {0} Refer to the implementation for the precise returned value.
   */
  /**
   * useState - Auto-generated documentation stub.
   *
   * @returns {0} Result produced by useState.
   */
  const [layersRevision, setLayersRevision] = useState(0);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   */
  const bumpLayersRevision = useCallback(() => {
    /**
     * setLayersRevision - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * setLayersRevision - Auto-generated documentation stub.
     */
    setLayersRevision((previous) => previous + 1);
  }, []);

  const initialLayerState = useMemo<LayerDescriptor[]>(() => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {initialLayers && initialLayers.length > 0} Refer to the implementation for the precise returned value.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {initialLayers && initialLayers.length > 0} Result produced by if.
     */
    if (initialLayers && initialLayers.length > 0) {
      /**
       * normaliseLayerDefinitions - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {initialLayers} Refer to the implementation for the precise returned value.
       */
      /**
       * normaliseLayerDefinitions - Auto-generated documentation stub.
       *
       * @returns {initialLayers} Result produced by normaliseLayerDefinitions.
       */
      return normaliseLayerDefinitions(initialLayers);
    }

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {children} Refer to the implementation for the precise returned value.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {children} Result produced by if.
     */
    if (children) {
      return normaliseLayerDefinitions([
        {
          name: 'Layer 1',
          position: { x: 0, y: 0 },
          render: () => <>{children}</>,
        },
      ]);
    }

    return [];
  }, [initialLayers, children]);

  const [layers, setLayers] = useState<LayerDescriptor[]>(() => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {initialLayerState.length > 0} Refer to the implementation for the precise returned value.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {initialLayerState.length > 0} Result produced by if.
     */
    if (initialLayerState.length > 0) {
      return initialLayerState;
    }

    return [
      {
        /**
         * generateLayerId - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * generateLayerId - Auto-generated documentation stub.
         */
        id: generateLayerId(),
        name: 'Layer 1',
        visible: true,
        position: { x: 0, y: 0 },
        rotation: 0,
        scale: { x: 1, y: 1 },
        render: () => null,
      },
    ];
  });

  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>(() => {
    const firstLayer = initialLayerState[0];
    return firstLayer ? [firstLayer.id] : [];
  });
  const [primaryLayerId, setPrimaryLayerId] = useState<string | null>(() => {
    const firstLayer = initialLayerState[0];
    return firstLayer?.id ?? null;
  });

  /**
   * useMemo - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useMemo - Auto-generated documentation stub.
   */
  const layerIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    /**
     * forEach - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} (layer - Parameter derived from the static analyzer.
     * @param {*} index - Parameter derived from the static analyzer.
     */
    /**
     * forEach - Auto-generated documentation stub.
     *
     * @param {*} (layer - Parameter forwarded to forEach.
     * @param {*} index - Parameter forwarded to forEach.
     */
    layers.forEach((layer, index) => {
      /**
       * set - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} layer.id - Parameter derived from the static analyzer.
       * @param {*} index - Parameter derived from the static analyzer.
       *
       * @returns {layer.id, index} Refer to the implementation for the precise returned value.
       */
      /**
       * set - Auto-generated documentation stub.
       *
       * @param {*} layer.id - Parameter forwarded to set.
       * @param {*} index - Parameter forwarded to set.
       *
       * @returns {layer.id, index} Result produced by set.
       */
      map.set(layer.id, index);
    });
    return map;
  }, [layers]);

  /**
   * useEffect - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useEffect - Auto-generated documentation stub.
   */
  useEffect(() => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (layers.length === 0) {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {selectedLayerIds.length > 0} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {selectedLayerIds.length > 0} Result produced by if.
       */
      if (selectedLayerIds.length > 0) {
        /**
         * setSelectedLayerIds - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {[]} Refer to the implementation for the precise returned value.
         */
        /**
         * setSelectedLayerIds - Auto-generated documentation stub.
         *
         * @returns {[]} Result produced by setSelectedLayerIds.
         */
        setSelectedLayerIds([]);
      }
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      if (primaryLayerId !== null) {
        /**
         * setPrimaryLayerId - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {null} Refer to the implementation for the precise returned value.
         */
        /**
         * setPrimaryLayerId - Auto-generated documentation stub.
         *
         * @returns {null} Result produced by setPrimaryLayerId.
         */
        setPrimaryLayerId(null);
      }
      return;
    }
    /**
     * filter - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * filter - Auto-generated documentation stub.
     */
    const validSelected = selectedLayerIds.filter((id) => layerIndexMap.has(id));
    // Allow empty selection. If there are no valid selected IDs, keep selection empty.
    const sortedSelection = validSelected.length > 0
      ? [...validSelected].sort(
        /**
         * get - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {a} Refer to the implementation for the precise returned value.
         */
        /**
         * get - Auto-generated documentation stub.
         *
         * @returns {a} Result produced by get.
         */
        (a, b) => (layerIndexMap.get(a) ?? 0) - (layerIndexMap.get(b) ?? 0)
      )
      : [];

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} !areSelectionsEqual(selectedLayerIds - Parameter derived from the static analyzer.
     * @param {*} sortedSelection - Parameter derived from the static analyzer.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @param {*} !areSelectionsEqual(selectedLayerIds - Parameter forwarded to if.
     * @param {*} sortedSelection - Parameter forwarded to if.
     */
    if (!areSelectionsEqual(selectedLayerIds, sortedSelection)) {
      /**
       * setSelectedLayerIds - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {sortedSelection} Refer to the implementation for the precise returned value.
       */
      /**
       * setSelectedLayerIds - Auto-generated documentation stub.
       *
       * @returns {sortedSelection} Result produced by setSelectedLayerIds.
       */
      setSelectedLayerIds(sortedSelection);
    }

    const primaryCandidate = sortedSelection.length > 0
      /**
       * includes - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {primaryLayerId ?? ''} Refer to the implementation for the precise returned value.
       */
      /**
       * includes - Auto-generated documentation stub.
       *
       * @returns {primaryLayerId ?? ''} Result produced by includes.
       */
      ? (sortedSelection.includes(primaryLayerId ?? '')
        ? (primaryLayerId ?? sortedSelection[sortedSelection.length - 1])
        : sortedSelection[sortedSelection.length - 1])
      : null;

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (primaryCandidate !== primaryLayerId) {
      /**
       * setPrimaryLayerId - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {primaryCandidate} Refer to the implementation for the precise returned value.
       */
      setPrimaryLayerId(primaryCandidate);
    }
  }, [layers, layerIndexMap, primaryLayerId, selectedLayerIds]);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   */
  const clearSelection = useCallback(() => {
    /**
     * setSelectedLayerIds - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {[]} Refer to the implementation for the precise returned value.
     */
    setSelectedLayerIds([]);
    /**
     * setPrimaryLayerId - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {null} Refer to the implementation for the precise returned value.
     */
    /**
     * setPrimaryLayerId - Auto-generated documentation stub.
     *
     * @returns {null} Result produced by setPrimaryLayerId.
     */
    setPrimaryLayerId(null);
  }, []);

  const selectLayer = useCallback<LayerControlHandlers['selectLayer']>((layerId, options) => {
    const mode = options?.mode ?? 'replace';

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (!layerIndexMap.has(layerId)) {
      return selectedLayerIds;
    }

    const uniqueAndSorted = (ids: string[]): string[] => {
      const seen = new Set<string>();
      const filtered: string[] = [];
      /**
       * forEach - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * forEach - Auto-generated documentation stub.
       */
      ids.forEach((id) => {
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * if - Auto-generated documentation stub.
         */
        if (layerIndexMap.has(id) && !seen.has(id)) {
          /**
           * add - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {id} Refer to the implementation for the precise returned value.
           */
          /**
           * add - Auto-generated documentation stub.
           *
           * @returns {id} Result produced by add.
           */
          seen.add(id);
          /**
           * push - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {id} Refer to the implementation for the precise returned value.
           */
          /**
           * push - Auto-generated documentation stub.
           *
           * @returns {id} Result produced by push.
           */
          filtered.push(id);
        }
      });
      /**
       * sort - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} (a - Parameter derived from the static analyzer.
       * @param {*} b - Parameter derived from the static analyzer.
       */
      /**
       * sort - Auto-generated documentation stub.
       *
       * @param {*} (a - Parameter forwarded to sort.
       * @param {*} b - Parameter forwarded to sort.
       */
      filtered.sort((a, b) => (layerIndexMap.get(a) ?? 0) - (layerIndexMap.get(b) ?? 0));
      return filtered;
    };

    /**
     * filter - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * filter - Auto-generated documentation stub.
     */
    const currentSelection = selectedLayerIds.filter((id) => layerIndexMap.has(id));
    /**
     * includes - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {layerId} Refer to the implementation for the precise returned value.
     */
    const isSelected = currentSelection.includes(layerId);
    let nextSelection: string[] = [];

    /**
     * switch - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {mode} Refer to the implementation for the precise returned value.
     */
    /**
     * switch - Auto-generated documentation stub.
     *
     * @returns {mode} Result produced by switch.
     */
    switch (mode) {
      case 'append': {
        nextSelection = isSelected
          ? currentSelection
          /**
           * uniqueAndSorted - Auto-generated summary; refine if additional context is needed.
           *
           * @param {*} [...currentSelection - Parameter derived from the static analyzer.
           * @param {*} layerId] - Parameter derived from the static analyzer.
           *
           * @returns {[...currentSelection, layerId]} Refer to the implementation for the precise returned value.
           */
          /**
           * uniqueAndSorted - Auto-generated documentation stub.
           *
           * @param {*} [...currentSelection - Parameter forwarded to uniqueAndSorted.
           * @param {*} layerId] - Parameter forwarded to uniqueAndSorted.
           *
           * @returns {[...currentSelection, layerId]} Result produced by uniqueAndSorted.
           */
          : uniqueAndSorted([...currentSelection, layerId]);
        break;
      }
      case 'toggle': {
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {isSelected} Refer to the implementation for the precise returned value.
         */
        /**
         * if - Auto-generated documentation stub.
         *
         * @returns {isSelected} Result produced by if.
         */
        if (isSelected) {
          /**
           * filter - Auto-generated summary; refine if additional context is needed.
           */
          /**
           * filter - Auto-generated documentation stub.
           */
          const remaining = currentSelection.filter((id) => id !== layerId);
          nextSelection = remaining.length > 0 ? remaining : currentSelection;
        } else {
          /**
           * uniqueAndSorted - Auto-generated summary; refine if additional context is needed.
           *
           * @param {*} [...currentSelection - Parameter derived from the static analyzer.
           * @param {*} layerId] - Parameter derived from the static analyzer.
           *
           * @returns {[...currentSelection, layerId]} Refer to the implementation for the precise returned value.
           */
          /**
           * uniqueAndSorted - Auto-generated documentation stub.
           *
           * @param {*} [...currentSelection - Parameter forwarded to uniqueAndSorted.
           * @param {*} layerId] - Parameter forwarded to uniqueAndSorted.
           *
           * @returns {[...currentSelection, layerId]} Result produced by uniqueAndSorted.
           */
          nextSelection = uniqueAndSorted([...currentSelection, layerId]);
        }
        break;
      }
      case 'range': {
        const anchorId =
          /**
           * has - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {primaryLayerId} Refer to the implementation for the precise returned value.
           */
          /**
           * has - Auto-generated documentation stub.
           *
           * @returns {primaryLayerId} Result produced by has.
           */
          (primaryLayerId && layerIndexMap.has(primaryLayerId))
            ? primaryLayerId
            : currentSelection[currentSelection.length - 1] ?? layerId;
        /**
         * get - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {anchorId} Refer to the implementation for the precise returned value.
         */
        /**
         * get - Auto-generated documentation stub.
         *
         * @returns {anchorId} Result produced by get.
         */
        const anchorIndex = layerIndexMap.get(anchorId) ?? 0;
        /**
         * get - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {layerId} Refer to the implementation for the precise returned value.
         */
        /**
         * get - Auto-generated documentation stub.
         *
         * @returns {layerId} Result produced by get.
         */
        const targetIndex = layerIndexMap.get(layerId) ?? anchorIndex;
        const [start, end] =
          anchorIndex <= targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];
        /**
         * slice - Auto-generated summary; refine if additional context is needed.
         *
         * @param {*} start - Parameter derived from the static analyzer.
         * @param {*} end + 1 - Parameter derived from the static analyzer.
         *
         * @returns {start, end + 1} Refer to the implementation for the precise returned value.
         */
        /**
         * slice - Auto-generated documentation stub.
         *
         * @param {*} start - Parameter forwarded to slice.
         * @param {*} end + 1 - Parameter forwarded to slice.
         *
         * @returns {start, end + 1} Result produced by slice.
         */
        const rangeSelection = layers.slice(start, end + 1).map((layer) => layer.id);
        /**
         * uniqueAndSorted - Auto-generated summary; refine if additional context is needed.
         *
         * @param {*} [...currentSelection - Parameter derived from the static analyzer.
         * @param {*} ...rangeSelection] - Parameter derived from the static analyzer.
         *
         * @returns {[...currentSelection, ...rangeSelection]} Refer to the implementation for the precise returned value.
         */
        /**
         * uniqueAndSorted - Auto-generated documentation stub.
         *
         * @param {*} [...currentSelection - Parameter forwarded to uniqueAndSorted.
         * @param {*} ...rangeSelection] - Parameter forwarded to uniqueAndSorted.
         *
         * @returns {[...currentSelection, ...rangeSelection]} Result produced by uniqueAndSorted.
         */
        nextSelection = uniqueAndSorted([...currentSelection, ...rangeSelection]);
        break;
      }
      case 'replace':
      default:
        nextSelection = [layerId];
        break;
    }

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (nextSelection.length === 0) {
      nextSelection = [layerId];
    }

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} !areSelectionsEqual(selectedLayerIds - Parameter derived from the static analyzer.
     * @param {*} nextSelection - Parameter derived from the static analyzer.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @param {*} !areSelectionsEqual(selectedLayerIds - Parameter forwarded to if.
     * @param {*} nextSelection - Parameter forwarded to if.
     */
    if (!areSelectionsEqual(selectedLayerIds, nextSelection)) {
      /**
       * setSelectedLayerIds - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {nextSelection} Refer to the implementation for the precise returned value.
       */
      /**
       * setSelectedLayerIds - Auto-generated documentation stub.
       *
       * @returns {nextSelection} Result produced by setSelectedLayerIds.
       */
      setSelectedLayerIds(nextSelection);
    }

    const nextPrimary =
      mode === 'toggle' && isSelected && nextSelection.length > 0
        ? nextSelection[nextSelection.length - 1]
        : layerId;

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (nextPrimary !== primaryLayerId) {
      /**
       * setPrimaryLayerId - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {nextPrimary} Refer to the implementation for the precise returned value.
       */
      setPrimaryLayerId(nextPrimary);
    }

    return nextSelection;
  }, [layerIndexMap, layers, primaryLayerId, selectedLayerIds]);

  const addLayer = useCallback<LayerControlHandlers['addLayer']>(() => {
    let newLayerId: string | null = null;

    /**
     * setLayers - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * setLayers - Auto-generated documentation stub.
     */
    setLayers((previousLayers) => {
      /**
       * generateLayerId - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * generateLayerId - Auto-generated documentation stub.
       */
      const id = generateLayerId();
      newLayerId = id;

      const nextLayer: LayerDescriptor = {
        id,
        name: `Layer ${previousLayers.length + 1}`,
        visible: true,
        position: { x: 0, y: 0 },
        rotation: 0,
        scale: { x: 1, y: 1 },
        render: () => null,
      };

      return [nextLayer, ...previousLayers];
    });

    /**
     * bumpLayersRevision - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * bumpLayersRevision - Auto-generated documentation stub.
     */
    bumpLayersRevision();

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {newLayerId} Refer to the implementation for the precise returned value.
     */
    if (newLayerId) {
      /**
       * setSelectedLayerIds - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {[newLayerId]} Refer to the implementation for the precise returned value.
       */
      /**
       * setSelectedLayerIds - Auto-generated documentation stub.
       *
       * @returns {[newLayerId]} Result produced by setSelectedLayerIds.
       */
      setSelectedLayerIds([newLayerId]);
      /**
       * setPrimaryLayerId - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {newLayerId} Refer to the implementation for the precise returned value.
       */
      /**
       * setPrimaryLayerId - Auto-generated documentation stub.
       *
       * @returns {newLayerId} Result produced by setPrimaryLayerId.
       */
      setPrimaryLayerId(newLayerId);
    }
  }, [bumpLayersRevision]);

  const removeLayer = useCallback<LayerControlHandlers['removeLayer']>((layerId) => {
    let fallbackLayerId: string | null = null;

    /**
     * setLayers - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * setLayers - Auto-generated documentation stub.
     */
    setLayers((previousLayers) => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (previousLayers.length <= 1) {
        return previousLayers;
      }

      /**
       * findIndex - Auto-generated summary; refine if additional context is needed.
       */
      const index = previousLayers.findIndex((layer) => layer.id === layerId);
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (index === -1) {
        return previousLayers;
      }

      const updatedLayers = [
        /**
         * slice - Auto-generated summary; refine if additional context is needed.
         *
         * @param {*} 0 - Parameter derived from the static analyzer.
         * @param {*} index - Parameter derived from the static analyzer.
         *
         * @returns {0, index} Refer to the implementation for the precise returned value.
         */
        /**
         * slice - Auto-generated documentation stub.
         *
         * @param {*} 0 - Parameter forwarded to slice.
         * @param {*} index - Parameter forwarded to slice.
         *
         * @returns {0, index} Result produced by slice.
         */
        ...previousLayers.slice(0, index),
        /**
         * slice - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {index + 1} Refer to the implementation for the precise returned value.
         */
        /**
         * slice - Auto-generated documentation stub.
         *
         * @returns {index + 1} Result produced by slice.
         */
        ...previousLayers.slice(index + 1),
      ];

      /**
       * min - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} index - Parameter derived from the static analyzer.
       * @param {*} updatedLayers.length - 1 - Parameter derived from the static analyzer.
       *
       * @returns {index, updatedLayers.length - 1} Refer to the implementation for the precise returned value.
       */
      /**
       * min - Auto-generated documentation stub.
       *
       * @param {*} index - Parameter forwarded to min.
       * @param {*} updatedLayers.length - 1 - Parameter forwarded to min.
       *
       * @returns {index, updatedLayers.length - 1} Result produced by min.
       */
      fallbackLayerId = updatedLayers[Math.min(index, updatedLayers.length - 1)]?.id ?? null;

      return updatedLayers;
    });

    /**
     * setSelectedLayerIds - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * setSelectedLayerIds - Auto-generated documentation stub.
     */
    setSelectedLayerIds((currentSelection) => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (!currentSelection.includes(layerId)) {
        return currentSelection;
      }

      /**
       * filter - Auto-generated summary; refine if additional context is needed.
       */
      const filtered = currentSelection.filter((id) => id !== layerId);
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {filtered.length > 0} Refer to the implementation for the precise returned value.
       */
      if (filtered.length > 0) {
        return filtered;
      }

      return fallbackLayerId ? [fallbackLayerId] : [];
    });

    /**
     * setPrimaryLayerId - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * setPrimaryLayerId - Auto-generated documentation stub.
     */
    setPrimaryLayerId((currentPrimary) => {
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (currentPrimary === layerId) {
        return fallbackLayerId;
      }
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (currentPrimary && currentPrimary !== layerId) {
        return currentPrimary;
      }
      return fallbackLayerId;
    });

    /**
     * bumpLayersRevision - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * bumpLayersRevision - Auto-generated documentation stub.
     */
    bumpLayersRevision();
  }, [bumpLayersRevision]);

  const duplicateLayer = useCallback<LayerControlHandlers['duplicateLayer']>((layerId) => {
    let newLayerId: string | null = null;

    /**
     * setLayers - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * setLayers - Auto-generated documentation stub.
     */
    setLayers((previousLayers) => {
      /**
       * findIndex - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * findIndex - Auto-generated documentation stub.
       */
      const index = previousLayers.findIndex((layer) => layer.id === layerId);
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (index === -1) {
        return previousLayers;
      }

      const source = previousLayers[index];
      /**
       * generateLayerId - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * generateLayerId - Auto-generated documentation stub.
       */
      const id = generateLayerId();
      newLayerId = id;

      const clone: LayerDescriptor = {
        ...source,
        id,
        name: `${source.name} Copy`,
      };

      const nextLayers = [...previousLayers];
      /**
       * splice - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} index - Parameter derived from the static analyzer.
       * @param {*} 0 - Parameter derived from the static analyzer.
       * @param {*} clone - Parameter derived from the static analyzer.
       *
       * @returns {index, 0, clone} Refer to the implementation for the precise returned value.
       */
      /**
       * splice - Auto-generated documentation stub.
       *
       * @param {*} index - Parameter forwarded to splice.
       * @param {*} 0 - Parameter forwarded to splice.
       * @param {*} clone - Parameter forwarded to splice.
       *
       * @returns {index, 0, clone} Result produced by splice.
       */
      nextLayers.splice(index, 0, clone);
      return nextLayers;
    });
    /**
     * bumpLayersRevision - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * bumpLayersRevision - Auto-generated documentation stub.
     */
    bumpLayersRevision();

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {newLayerId} Refer to the implementation for the precise returned value.
     */
    if (newLayerId) {
      /**
       * setSelectedLayerIds - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {[newLayerId]} Refer to the implementation for the precise returned value.
       */
      /**
       * setSelectedLayerIds - Auto-generated documentation stub.
       *
       * @returns {[newLayerId]} Result produced by setSelectedLayerIds.
       */
      setSelectedLayerIds([newLayerId]);
      /**
       * setPrimaryLayerId - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {newLayerId} Refer to the implementation for the precise returned value.
       */
      /**
       * setPrimaryLayerId - Auto-generated documentation stub.
       *
       * @returns {newLayerId} Result produced by setPrimaryLayerId.
       */
      setPrimaryLayerId(newLayerId);
    }
  }, [bumpLayersRevision]);

  /**
   * layerId - Auto-generated summary; refine if additional context is needed.
   *
   * @async
   */
  /**
   * layerId - Auto-generated documentation stub.
   *
   * @async
   */
  const copyLayer = useCallback<LayerControlHandlers['copyLayer']>(async (layerId) => {
    /**
     * find - Auto-generated summary; refine if additional context is needed.
     */
    const target = layers.find((layer) => layer.id === layerId);

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {!target} Refer to the implementation for the precise returned value.
     */
    if (!target) {
      return 'Layer not found';
    }

    const summary = JSON.stringify(
      {
        name: target.name,
        visible: target.visible,
        rotation: target.rotation ?? 0,
        scale: target.scale ?? { x: 1, y: 1 },
      },
      null,
      2
    );

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * if - Auto-generated documentation stub.
     */
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        /**
         * writeText - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {summary} Refer to the implementation for the precise returned value.
         */
        await navigator.clipboard.writeText(summary);
        return 'Layer details copied to clipboard';
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
        /**
         * warn - Auto-generated summary; refine if additional context is needed.
         *
         * @param {*} 'Failed to copy layer details' - Parameter derived from the static analyzer.
         * @param {*} error - Parameter derived from the static analyzer.
         *
         * @returns {'Failed to copy layer details', error} Refer to the implementation for the precise returned value.
         */
        /**
         * warn - Auto-generated documentation stub.
         *
         * @param {*} 'Failed to copy layer details' - Parameter forwarded to warn.
         * @param {*} error - Parameter forwarded to warn.
         *
         * @returns {'Failed to copy layer details', error} Result produced by warn.
         */
        console.warn('Failed to copy layer details', error);
        return 'Clipboard copy failed';
      }
    }

    return summary;
  }, [layers]);

  const moveLayer = useCallback<LayerControlHandlers['moveLayer']>((layerId, direction) => {
    /**
     * setLayers - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * setLayers - Auto-generated documentation stub.
     */
    setLayers((previousLayers) => {
      /**
       * findIndex - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * findIndex - Auto-generated documentation stub.
       */
      const index = previousLayers.findIndex((layer) => layer.id === layerId);
      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (index === -1) {
        return previousLayers;
      }

      let targetIndex = index;

      /**
       * switch - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {direction} Refer to the implementation for the precise returned value.
       */
      /**
       * switch - Auto-generated documentation stub.
       *
       * @returns {direction} Result produced by switch.
       */
      switch (direction) {
        case 'up':
          /**
           * max - Auto-generated summary; refine if additional context is needed.
           *
           * @param {*} 0 - Parameter derived from the static analyzer.
           * @param {*} index - 1 - Parameter derived from the static analyzer.
           *
           * @returns {0, index - 1} Refer to the implementation for the precise returned value.
           */
          /**
           * max - Auto-generated documentation stub.
           *
           * @param {*} 0 - Parameter forwarded to max.
           * @param {*} index - 1 - Parameter forwarded to max.
           *
           * @returns {0, index - 1} Result produced by max.
           */
          targetIndex = Math.max(0, index - 1);
          break;
        case 'down':
          /**
           * min - Auto-generated summary; refine if additional context is needed.
           *
           * @param {*} previousLayers.length - 1 - Parameter derived from the static analyzer.
           * @param {*} index + 1 - Parameter derived from the static analyzer.
           *
           * @returns {previousLayers.length - 1, index + 1} Refer to the implementation for the precise returned value.
           */
          /**
           * min - Auto-generated documentation stub.
           *
           * @param {*} previousLayers.length - 1 - Parameter forwarded to min.
           * @param {*} index + 1 - Parameter forwarded to min.
           *
           * @returns {previousLayers.length - 1, index + 1} Result produced by min.
           */
          targetIndex = Math.min(previousLayers.length - 1, index + 1);
          break;
        case 'top':
          targetIndex = 0;
          break;
        case 'bottom':
          targetIndex = previousLayers.length - 1;
          break;
        default:
          targetIndex = index;
          break;
      }

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (targetIndex === index) {
        return previousLayers;
      }

      const updatedLayers = [...previousLayers];
      /**
       * splice - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} index - Parameter derived from the static analyzer.
       * @param {*} 1 - Parameter derived from the static analyzer.
       *
       * @returns {index, 1} Refer to the implementation for the precise returned value.
       */
      /**
       * splice - Auto-generated documentation stub.
       *
       * @param {*} index - Parameter forwarded to splice.
       * @param {*} 1 - Parameter forwarded to splice.
       *
       * @returns {index, 1} Result produced by splice.
       */
      const [layer] = updatedLayers.splice(index, 1);
      /**
       * splice - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} targetIndex - Parameter derived from the static analyzer.
       * @param {*} 0 - Parameter derived from the static analyzer.
       * @param {*} layer - Parameter derived from the static analyzer.
       *
       * @returns {targetIndex, 0, layer} Refer to the implementation for the precise returned value.
       */
      /**
       * splice - Auto-generated documentation stub.
       *
       * @param {*} targetIndex - Parameter forwarded to splice.
       * @param {*} 0 - Parameter forwarded to splice.
       * @param {*} layer - Parameter forwarded to splice.
       *
       * @returns {targetIndex, 0, layer} Result produced by splice.
       */
      updatedLayers.splice(targetIndex, 0, layer);

      /**
       * map - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * map - Auto-generated documentation stub.
       */
      return updatedLayers.map((entry) =>
        entry.visible ? entry : { ...entry, visible: true }
      );
    });
    /**
     * bumpLayersRevision - Auto-generated summary; refine if additional context is needed.
     */
    bumpLayersRevision();
  }, [bumpLayersRevision]);

  const reorderLayer = useCallback<LayerControlHandlers['reorderLayer']>((sourceId, targetId, position) => {
    /**
     * if - Auto-generated summary; refine if additional context is needed.
     */
    if (sourceId === targetId) {
      return;
    }

    /**
     * setLayers - Auto-generated summary; refine if additional context is needed.
     */
    setLayers((previousLayers) => {
      /**
       * findIndex - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * findIndex - Auto-generated documentation stub.
       */
      const sourceIndex = previousLayers.findIndex((layer) => layer.id === sourceId);
      /**
       * findIndex - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * findIndex - Auto-generated documentation stub.
       */
      const targetIndex = previousLayers.findIndex((layer) => layer.id === targetId);

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (sourceIndex === -1 || targetIndex === -1) {
        return previousLayers;
      }

      const updatedLayers = [...previousLayers];
      /**
       * splice - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} sourceIndex - Parameter derived from the static analyzer.
       * @param {*} 1 - Parameter derived from the static analyzer.
       *
       * @returns {sourceIndex, 1} Refer to the implementation for the precise returned value.
       */
      /**
       * splice - Auto-generated documentation stub.
       *
       * @param {*} sourceIndex - Parameter forwarded to splice.
       * @param {*} 1 - Parameter forwarded to splice.
       *
       * @returns {sourceIndex, 1} Result produced by splice.
       */
      const [movedLayer] = updatedLayers.splice(sourceIndex, 1);

      let insertionIndex = targetIndex;

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {sourceIndex < targetIndex} Refer to the implementation for the precise returned value.
       */
      /**
       * if - Auto-generated documentation stub.
       *
       * @returns {sourceIndex < targetIndex} Result produced by if.
       */
      if (sourceIndex < targetIndex) {
        insertionIndex -= 1;
      }

      /**
       * if - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * if - Auto-generated documentation stub.
       */
      if (position === 'below') {
        insertionIndex += 1;
      }

      /**
       * max - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} 0 - Parameter derived from the static analyzer.
       * @param {*} Math.min(updatedLayers.length - Parameter derived from the static analyzer.
       * @param {*} insertionIndex - Parameter derived from the static analyzer.
       */
      /**
       * max - Auto-generated documentation stub.
       *
       * @param {*} 0 - Parameter forwarded to max.
       * @param {*} Math.min(updatedLayers.length - Parameter forwarded to max.
       * @param {*} insertionIndex - Parameter forwarded to max.
       */
      insertionIndex = Math.max(0, Math.min(updatedLayers.length, insertionIndex));

      /**
       * splice - Auto-generated summary; refine if additional context is needed.
       *
       * @param {*} insertionIndex - Parameter derived from the static analyzer.
       * @param {*} 0 - Parameter derived from the static analyzer.
       * @param {*} movedLayer - Parameter derived from the static analyzer.
       *
       * @returns {insertionIndex, 0, movedLayer} Refer to the implementation for the precise returned value.
       */
      updatedLayers.splice(insertionIndex, 0, movedLayer);
      return updatedLayers;
    });
    /**
     * bumpLayersRevision - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * bumpLayersRevision - Auto-generated documentation stub.
     */
    bumpLayersRevision();
  }, [bumpLayersRevision]);

  const toggleVisibility = useCallback<LayerControlHandlers['toggleVisibility']>((layerId) => {
    /**
     * setLayers - Auto-generated summary; refine if additional context is needed.
     */
    setLayers((previousLayers) =>
      /**
       * map - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * map - Auto-generated documentation stub.
       */
      previousLayers.map((layer) =>
        layer.id === layerId
          ? { ...layer, visible: !layer.visible }
          : layer
      )
    );
    /**
     * bumpLayersRevision - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * bumpLayersRevision - Auto-generated documentation stub.
     */
    bumpLayersRevision();
  }, [bumpLayersRevision]);

  /**
   * useCallback - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useCallback - Auto-generated documentation stub.
   */
  const ensureAllVisible = useCallback(() => {
    /**
     * setLayers - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * setLayers - Auto-generated documentation stub.
     */
    setLayers((previousLayers) =>
      /**
       * map - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * map - Auto-generated documentation stub.
       */
      previousLayers.map((layer) =>
        layer.visible ? layer : { ...layer, visible: true }
      )
    );
    /**
     * bumpLayersRevision - Auto-generated summary; refine if additional context is needed.
     */
    bumpLayersRevision();
  }, [bumpLayersRevision]);

  const updateLayerPosition = useCallback<LayerControlHandlers['updateLayerPosition']>((layerId, position) => {
    /**
     * setLayers - Auto-generated summary; refine if additional context is needed.
     */
    setLayers((previousLayers) =>
      /**
       * map - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * map - Auto-generated documentation stub.
       */
      previousLayers.map((layer) =>
        layer.id === layerId
          ? { ...layer, position }
          : layer
      )
    );
  }, []);

  const updateLayerRotation = useCallback<NonNullable<LayerControlHandlers['updateLayerRotation']>>((layerId, rotation) => {
    /**
     * setLayers - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * setLayers - Auto-generated documentation stub.
     */
    setLayers((previousLayers) =>
      /**
       * map - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * map - Auto-generated documentation stub.
       */
      previousLayers.map((layer) =>
        layer.id === layerId
          ? { ...layer, rotation }
          : layer
      )
    );
  }, []);

  const updateLayerScale = useCallback<NonNullable<LayerControlHandlers['updateLayerScale']>>((layerId, scale) => {
    /**
     * setLayers - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * setLayers - Auto-generated documentation stub.
     */
    setLayers((previousLayers) =>
      /**
       * map - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * map - Auto-generated documentation stub.
       */
      previousLayers.map((layer) =>
        layer.id === layerId
          ? { ...layer, scale }
          : layer
      )
    );
  }, []);

  const updateLayerTransform = useCallback<NonNullable<LayerControlHandlers['updateLayerTransform']>>((layerId, transform) => {
    /**
     * setLayers - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * setLayers - Auto-generated documentation stub.
     */
    setLayers((previousLayers) =>
      /**
       * map - Auto-generated summary; refine if additional context is needed.
       */
      /**
       * map - Auto-generated documentation stub.
       */
      previousLayers.map((layer) =>
        layer.id === layerId
          ? { ...layer, position: transform.position, rotation: transform.rotation, scale: transform.scale }
          : layer
      )
    );
  }, []);

  const layerControls = useMemo<LayerControlHandlers>(() => ({
    layers,
    selectedLayerIds,
    primaryLayerId,
    selectLayer,
    clearSelection,
    addLayer,
    removeLayer,
    duplicateLayer,
    copyLayer,
    moveLayer,
    toggleVisibility,
    reorderLayer,
    ensureAllVisible,
    updateLayerPosition,
    updateLayerScale,
    updateLayerRotation,
    updateLayerTransform,
  }), [
    layers,
    selectedLayerIds,
    primaryLayerId,
    selectLayer,
    clearSelection,
    addLayer,
    removeLayer,
    duplicateLayer,
    copyLayer,
    moveLayer,
    toggleVisibility,
    reorderLayer,
    ensureAllVisible,
    updateLayerPosition,
    updateLayerScale,
    updateLayerRotation,
    updateLayerTransform,
  ]);

  /**
   * handleStageReady - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * handleStageReady - Auto-generated documentation stub.
   */
  const handleStageReady = (stageInstance: Konva.Stage) => {
    /**
     * setStage - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {stageInstance} Refer to the implementation for the precise returned value.
     */
    setStage(stageInstance);
    /**
     * log - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 'Canvas stage ready - Parameter derived from the static analyzer.
     * @param {*} stageInstance - Parameter derived from the static analyzer.
     *
     * @returns {'Canvas stage ready:', stageInstance} Refer to the implementation for the precise returned value.
     */
    /**
     * log - Auto-generated documentation stub.
     *
     * @param {*} 'Canvas stage ready - Parameter forwarded to log.
     * @param {*} stageInstance - Parameter forwarded to log.
     *
     * @returns {'Canvas stage ready:', stageInstance} Result produced by log.
     */
    console.log('Canvas stage ready:', stageInstance);

    /**
     * if - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {onStageReady} Refer to the implementation for the precise returned value.
     */
    /**
     * if - Auto-generated documentation stub.
     *
     * @returns {onStageReady} Result produced by if.
     */
    if (onStageReady) {
      /**
       * onStageReady - Auto-generated summary; refine if additional context is needed.
       *
       * @returns {stageInstance} Refer to the implementation for the precise returned value.
       */
      /**
       * onStageReady - Auto-generated documentation stub.
       *
       * @returns {stageInstance} Result produced by onStageReady.
       */
      onStageReady(stageInstance);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <SimpleCanvas
        width={width}
        height={height}
        backgroundColor={backgroundColor}
        containerBackground={containerBackground}
        zoom={zoom}
        onStageReady={handleStageReady}
        onZoomChange={onZoomChange}
        panModeActive={panModeActive}
        layerControls={layerControls}
        layersRevision={layersRevision}
        selectModeActive={selectModeActive}
      />
    </div>
  );
};
