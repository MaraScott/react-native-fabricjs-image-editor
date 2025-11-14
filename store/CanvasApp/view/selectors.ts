/**
 * Redux Selectors for View State
 * Provides derived/computed state from the store
 */

import type { RootState } from '@store/CanvasApp';
import type { ViewState } from '@store/CanvasApp/view/types';

// Simplified type for elements - components will pass their own element types
type AnyElement = any;

/**
 * Compute bounding box from element bounds
 */
/**
 * Normalized bounding box used by the selection helpers. All positions are in
 * canvas coordinates regardless of the original element type.
 */
/**
 * ElementBounds interface - Generated documentation block.
 */
interface ElementBounds {
    left: number;
    right: number;
    top: number;
    bottom: number;
    centerX: number;
    centerY: number;
}

/**
 * Compute an approximate bounding box for any supported element. The math is
 * intentionally forgiving—when element metadata is missing we fall back to
 * zero-based coordinates so selection still works.
 */
/**
 * getElementBounds - Auto-generated documentation stub.
 *
 * @param {*} element - Parameter forwarded to getElementBounds.
 *
 * @returns {ElementBounds | null} Result produced by getElementBounds.
 */
function getElementBounds(element: AnyElement): ElementBounds | null {
    const x = element.x ?? 0;
    const y = element.y ?? 0;

    switch (element.type) {
        case 'rect':
        case 'frame':
        case 'triangle':
            return {
                left: x,
                right: x + (element.width ?? 0),
                top: y,
                bottom: y + (element.height ?? 0),
                centerX: x + (element.width ?? 0) / 2,
                centerY: y + (element.height ?? 0) / 2,
            };
        
        case 'circle':
            const radius = element.radius ?? 0;
            return {
                left: x - radius,
                right: x + radius,
                top: y - radius,
                bottom: y + radius,
                centerX: x,
                centerY: y,
            };
        
        case 'ellipse':
            const radiusX = element.radiusX ?? 0;
            const radiusY = element.radiusY ?? 0;
            return {
                left: x - radiusX,
                right: x + radiusX,
                top: y - radiusY,
                bottom: y + radiusY,
                centerX: x,
                centerY: y,
            };
        
        case 'image':
            return {
                left: x,
                right: x + (element.width ?? 0),
                top: y,
                bottom: y + (element.height ?? 0),
                centerX: x + (element.width ?? 0) / 2,
                centerY: y + (element.height ?? 0) / 2,
            };
        
        case 'text':
            return {
                left: x,
                right: x + (element.width ?? 0),
                top: y,
                bottom: y + (element.fontSize ?? 16),
                centerX: x + (element.width ?? 0) / 2,
                centerY: y + (element.fontSize ?? 16) / 2,
            };
        
        case 'line':
        case 'path':
        case 'pencil':
            // For lines/paths, compute bounding box from points
            // Simplified: use x,y as top-left with default size
            return {
                left: x,
                right: x + 100,
                top: y,
                bottom: y + 100,
                centerX: x + 50,
                centerY: y + 50,
            };
        
        default:
            return null;
    }
}

/**
 * Selector: Compute selection rectangle from selected elements
 * This makes selectionRect a derived state based on element positions
 */
/**
 * Derive a screen-space rectangle that encompasses every currently selected
 * element. Components can render this rectangle as a marquee without having to
 * duplicate the math.
 */
/**
 * selectSelectionRect Component
 * 
 * Renders the selectSelectionRect component.
 */
export const selectSelectionRect = (state: RootState, elements: AnyElement[]) => {
    const viewState = state.view as unknown as ViewState;
    const selectedIds = viewState.select.selectedIds;

    if (selectedIds.length === 0) {
        return null;
    }

    // Get selected elements
    /**
     * filter - Auto-generated documentation stub.
     */
    const selectedElements = elements.filter(el => selectedIds.includes(el.id));

    /**
     * if - Auto-generated documentation stub.
     */
    if (selectedElements.length === 0) {
        return null;
    }

    // Compute bounding box
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    /**
     * for - Auto-generated documentation stub.
     *
     * @returns {const element of selectedElements} Result produced by for.
     */
    for (const element of selectedElements) {
        /**
         * getElementBounds - Auto-generated documentation stub.
         *
         * @returns {element} Result produced by getElementBounds.
         */
        const bounds = getElementBounds(element);
        /**
         * if - Auto-generated documentation stub.
         *
         * @returns {!bounds} Result produced by if.
         */
        if (!bounds) continue;
        /**
         * min - Auto-generated documentation stub.
         *
         * @param {*} minX - Parameter forwarded to min.
         * @param {*} bounds.left - Parameter forwarded to min.
         *
         * @returns {minX, bounds.left} Result produced by min.
         */
        minX = Math.min(minX, bounds.left);
        /**
         * min - Auto-generated documentation stub.
         *
         * @param {*} minY - Parameter forwarded to min.
         * @param {*} bounds.top - Parameter forwarded to min.
         *
         * @returns {minY, bounds.top} Result produced by min.
         */
        minY = Math.min(minY, bounds.top);
        /**
         * max - Auto-generated documentation stub.
         *
         * @param {*} maxX - Parameter forwarded to max.
         * @param {*} bounds.right - Parameter forwarded to max.
         *
         * @returns {maxX, bounds.right} Result produced by max.
         */
        maxX = Math.max(maxX, bounds.right);
        /**
         * max - Auto-generated documentation stub.
         *
         * @param {*} maxY - Parameter forwarded to max.
         * @param {*} bounds.bottom - Parameter forwarded to max.
         *
         * @returns {maxY, bounds.bottom} Result produced by max.
         */
        maxY = Math.max(maxY, bounds.bottom);
    }

    // Check if we found valid bounds
    /**
     * if - Auto-generated documentation stub.
     */
    if (!Number.isFinite(minX) || !Number.isFinite(minY) || 
        /**
         * isFinite - Auto-generated documentation stub.
         *
         * @returns {maxX} Result produced by isFinite.
         */
        !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
        return null;
    }

    return {
        x: minX,
        y: minY,
        /**
         * max - Auto-generated documentation stub.
         *
         * @param {*} 1 - Parameter forwarded to max.
         * @param {*} maxX - minX - Parameter forwarded to max.
         *
         * @returns {1, maxX - minX} Result produced by max.
         */
        width: Math.max(1, maxX - minX),
        /**
 * selectSelectedElementsWithBounds Component
 * 
 * Renders the selectSelectedElementsWithBounds component.
 */
        height: Math.max(1, maxY - minY),
    };
};

/**
 * Selector: Get selected elements with their computed bounds
 */
/**
 * Returns every selected element along with the computed bounds so consumers
 * can render overlays without re-running the geometry helper.
 */
/**
 * selectSelectedElementsWithBounds - Auto-generated documentation stub.
 */
export const selectSelectedElementsWithBounds = (state: RootState, elements: AnyElement[]) => {
    const viewState = state.view as unknown as ViewState;
    const selectedIds = viewState.select.selectedIds;
    const selectedElements = elements.filter(el => selectedIds.includes(el.id));
    
    return selectedElements.map(element => ({
        element,
        /**
 * selectHasSelection Component
 * 
 * Renders the selectHasSelection component.
 */
        bounds: getElementBounds(element),
    }));
};

/**
 * Selector: Check if there is an active selection
 */
/**
 * Indicates whether the user currently has at least one element selected.
 */
/**
 * selectSelectionCount Component
 * 
 * Renders the selectSelectionCount component.
 */
export const selectHasSelection = (state: RootState) => {
    const viewState = state.view as unknown as ViewState;
    return viewState.select.selectedIds.length > 0;
};

/**
 * Selector: Get count of selected elements
 */
/**
 * Returns the number of elements that are part of the active selection.
 */
/**
 * selectIsElementSelected Component
 * 
 * Renders the selectIsElementSelected component.
 */
export const selectSelectionCount = (state: RootState) => {
    const viewState = state.view as unknown as ViewState;
    return viewState.select.selectedIds.length;
};

/**
 * Selector: Check if a specific element is selected
 */
/**
 * Convenience selector that reports whether the supplied element id is
 * currently selected.
 */
/**
 * selectIsElementSelected - Auto-generated documentation stub.
 */
export const selectIsElementSelected = (state: RootState, elementId: string) => {
    const viewState = state.view as unknown as ViewState;
    return viewState.select.selectedIds.includes(elementId);
};
