/**
 * Atomic Design - Atom: RotateHandle
 * Rotation handle for selection boxes
 */

import type { CSSProperties } from 'react';

export interface RotateHandleProps {
  left?: string | number;
  top?: string | number;
  onPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void;
}

/**
 * RotateHandle Atom - Visual handle for rotating selections
 * Typically positioned above the selection box
 */
export const RotateHandle = ({
  left = '50%',
  top = '-25px',
  onPointerDown,
}: RotateHandleProps) => {
  const handleStyle: CSSProperties = {
    position: 'absolute',
    width: '12px',
    height: '12px',
    background: '#ffffff',
    border: '2px solid #00f6ff',
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
    cursor: 'grab',
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
        onPointerDown?.(e);
      }}
      style={handleStyle}
      role="button"
      aria-label="rotate-handle"
    />
  );
};

RotateHandle.displayName = 'RotateHandle';
