/**
 * Layer Panel Types
 * 
 * Type definitions for layer management functionality
 */

import type { ReactNode } from 'react';

/**
 * CanvasLayerDefinition interface
 * 
 * Defines the structure of a canvas layer with rendering and transformation properties
 */
export interface CanvasLayerDefinition {
  /** Unique identifier for the layer (auto-generated if not provided) */
  id?: string;
  
  /** Display name of the layer */
  name: string;
  
  /** Whether the layer is visible */
  visible?: boolean;
  
  /** Position of the layer in canvas coordinates */
  position?: { x: number; y: number };
  
  /** Rotation angle in degrees */
  rotation?: number;
  
  /** Scale factors for x and y axes */
  scale?: { x: number; y: number };
  
  /** Function that renders the layer content */
  render: () => ReactNode;
}
