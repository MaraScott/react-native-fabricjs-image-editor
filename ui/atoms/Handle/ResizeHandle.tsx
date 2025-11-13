/**
 * Atomic Design - Atom: ResizeHandle
 * Transform/resize handle for selection boxes
 */

import type { CSSProperties } from 'react';

export interface ResizeHandleProps {
  direction: string;
  left?: string | number;
  top?: string | number;
  onPointerDown?: (direction: string, event: React.PointerEvent<HTMLDivElement>) => void;
}

/**
 * ResizeHandle Atom - Visual handle for resizing/transforming selections
 * Part of the selection transform UI
 */
export const ResizeHandle = ({
  direction,
  left = 0,
  top = 0,
  onPointerDown,
}: ResizeHandleProps) => {
  const handleStyle: CSSProperties = {
    position: 'absolute',
    width: '12px',
    height: '12px',
    background: '#00f6ff',
    borderRadius: '2px',
    /**
     * translate - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} -50% - Parameter derived from the static analyzer.
     * @param {*} -50% - Parameter derived from the static analyzer.
     *
     * @returns {-50%, -50%} Refer to the implementation for the precise returned value.
     */
    /**
     * translate - Auto-generated documentation stub.
     *
     * @param {*} -50% - Parameter forwarded to translate.
     * @param {*} -50% - Parameter forwarded to translate.
     *
     * @returns {-50%, -50%} Result produced by translate.
     */
    transform: 'translate(-50%, -50%)',
    zIndex: 16,
    /**
     * rgba - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} 0 - Parameter derived from the static analyzer.
     * @param {*} 0 - Parameter derived from the static analyzer.
     * @param {*} 0 - Parameter derived from the static analyzer.
     * @param {*} 0.2 - Parameter derived from the static analyzer.
     *
     * @returns {0,0,0,0.2} Refer to the implementation for the precise returned value.
     */
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    cursor: `${direction}-resize`,
    left,
    top,
  };

  return (
    <div
      onPointerDown={(e) => {
        /**
         * stopPropagation - Auto-generated summary; refine if additional context is needed.
         */
        /**
         * stopPropagation - Auto-generated documentation stub.
         */
        e.stopPropagation();
        onPointerDown?.(direction, e);
      }}
      style={handleStyle}
      role="button"
      aria-label={`resize-${direction}`}
    />
  );
};

ResizeHandle.displayName = 'ResizeHandle';
