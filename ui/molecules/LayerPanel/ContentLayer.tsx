/**
 * Atomic Design - Organism: ContentLayer
 * 
 * Renders a single content layer with draggable functionality and event handlers
 */

import { Layer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { ReactNode } from 'react';

/**
 * ContentLayer component props
 */
export interface ContentLayerProps {
  /**
   * Unique layer ID
   */
  id: string;
  /**
   * Layer name
   */
  name: string;
  /**
   * Whether the layer is visible
   */
  visible: boolean;
  /**
   * X position offset (includes stage viewport offset)
   */
  x: number;
  /**
   * Y position offset (includes stage viewport offset)
   */
  y: number;
  /**
   * Layer rotation in degrees
   */
  rotation: number;
  /**
   * X scale factor
   */
  scaleX: number;
  /**
   * Y scale factor
   */
  scaleY: number;
  /**
   * Whether the layer is draggable
   */
  draggable: boolean;
  /**
   * Whether this layer is currently selected
   */
  isSelected: boolean;
  /**
   * Render function for layer content
   */
  render: () => ReactNode;
  /**
   * Callback when layer ref is set or cleared
   */
  onRefChange?: (node: Konva.Layer | null) => void;
  /**
   * Click handler
   */
  onClick?: (event: KonvaEventObject<MouseEvent>) => void;
  /**
   * Tap handler (touch)
   */
  onTap?: (event: KonvaEventObject<TouchEvent>) => void;
  /**
   * Mouse enter handler
   */
  onMouseEnter?: (event: KonvaEventObject<MouseEvent>) => void;
  /**
   * Mouse leave handler
   */
  onMouseLeave?: (event: KonvaEventObject<MouseEvent>) => void;
  /**
   * Drag start handler
   */
  onDragStart?: (event: KonvaEventObject<DragEvent>) => void;
  /**
   * Drag move handler
   */
  onDragMove?: (event: KonvaEventObject<DragEvent>) => void;
  /**
   * Drag end handler
   */
  onDragEnd?: (event: KonvaEventObject<DragEvent>) => void;
}

/**
 * ContentLayer component
 * 
 * Renders a single layer with content, positioning, and interaction handlers
 * 
 * @param {ContentLayerProps} props - Component props
 * @returns {JSX.Element} Layer element with content
 */
export const ContentLayer = ({
  id,
  visible,
  x,
  y,
  rotation,
  scaleX,
  scaleY,
  draggable,
  render,
  onRefChange,
  onClick,
  onTap,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDragMove,
  onDragEnd,
}: ContentLayerProps) => {
  return (
    <Layer
      ref={onRefChange}
      key={id}
      id={`layer-${id}`}
      visible={visible}
      x={x}
      y={y}
      rotation={rotation}
      scaleX={scaleX}
      scaleY={scaleY}
      draggable={draggable}
      onClick={onClick}
      onTap={onTap}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
    >
      {render()}
    </Layer>
  );
};
