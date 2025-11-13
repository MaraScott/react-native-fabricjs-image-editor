/**
 * Atomic Design - Molecule: SelectionBox
 * Visual selection box with resize and rotate handles
 * Refactored to use atomic components
 */

import React from 'react';
import type { CSSProperties } from 'react';
import { ResizeHandle, RotateHandle } from '@atoms/Handle';

export type OverlayBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
};

/**
 * SelectionBoxProps interface - Auto-generated interface summary; customize as needed.
 */
/**
 * SelectionBoxProps interface - Generated documentation block.
 */
export interface SelectionBoxProps {
  box: OverlayBox;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onResizePointerDown?: (direction: string, e: React.PointerEvent<HTMLDivElement>) => void;
  onRotatePointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
}

/**
 * SelectionBox Molecule - Renders a selection box with transform handles
 * Combines ResizeHandle and RotateHandle atoms into a complete selection UI
 */
export const SelectionBox = ({
  box,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onResizePointerDown,
  onRotatePointerDown,
}: SelectionBoxProps): JSX.Element => {
  const { x, y, width, height, rotation = 0 } = box;

  const containerStyle: CSSProperties = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
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
    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
    transformOrigin: 'center center',
    pointerEvents: 'auto',
    boxSizing: 'border-box',
    zIndex: 15,
    border: `2px dashed #00f6ff`,
    background: 'transparent',
    cursor: 'grab',
  };

  return (
    <div
      style={containerStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Corner handles */}
      <ResizeHandle direction="nw" left="0%" top="0%" onPointerDown={onResizePointerDown} />
      <ResizeHandle direction="ne" left="100%" top="0%" onPointerDown={onResizePointerDown} />
      <ResizeHandle direction="sw" left="0%" top="100%" onPointerDown={onResizePointerDown} />
      <ResizeHandle direction="se" left="100%" top="100%" onPointerDown={onResizePointerDown} />

      {/* Edge handles */}
      <ResizeHandle direction="n" left="50%" top="0%" onPointerDown={onResizePointerDown} />
      <ResizeHandle direction="e" left="100%" top="50%" onPointerDown={onResizePointerDown} />
      <ResizeHandle direction="s" left="50%" top="100%" onPointerDown={onResizePointerDown} />
      <ResizeHandle direction="w" left="0%" top="50%" onPointerDown={onResizePointerDown} />

      */
      {/* Rotate handle (above top center) */}
      <RotateHandle onPointerDown={onRotatePointerDown} />
    </div>
  );
};

SelectionBox.displayName = 'SelectionBox';

export default SelectionBox;
