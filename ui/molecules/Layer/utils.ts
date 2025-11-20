/**
 * Layer Panel Utilities
 * 
 * Utility functions for layer management
 */

import type { LayerDescriptor } from '@molecules/Canvas';
import type { CanvasLayerDefinition } from '@molecules/Layer/types';

/**
 * Generate a unique layer ID
 * 
 * Creates a unique identifier for a layer using crypto.randomUUID if available,
 * otherwise falls back to a random string generation
 * 
 * @returns {string} Unique layer identifier
 */
export const generateLayerId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  return `layer-${Math.random().toString(36).slice(2, 11)}`;
};

/**
 * Normalize layer definitions
 * 
 * Converts CanvasLayerDefinition objects to LayerDescriptor objects with default values
 * 
 * @param {CanvasLayerDefinition[]} definitions - Array of layer definitions to normalize
 * @returns {LayerDescriptor[]} Normalized layer descriptors
 */
export const normaliseLayerDefinitions = (
  definitions: CanvasLayerDefinition[]
): LayerDescriptor[] => {
  return definitions.map((definition, index) => ({
    id: definition.id ?? generateLayerId(),
    name: definition.name ?? `Layer ${index + 1}`,
    visible: definition.visible ?? true,
    position: definition.position ?? { x: 0, y: 0 },
    rotation: definition.rotation ?? 0,
    scale: definition.scale ?? { x: 1, y: 1 },
    render: definition.render,
  }));
};

/**
 * Check if two selection arrays are equal
 * 
 * Compares two arrays of layer IDs to determine if they represent the same selection
 * 
 * @param {string[]} first - First selection array
 * @param {string[]} second - Second selection array
 * @returns {boolean} True if selections are equal
 */
export const areSelectionsEqual = (first: string[], second: string[]): boolean => {
  if (first === second) {
    return true;
  }
  
  if (first.length !== second.length) {
    return false;
  }
  
  for (let index = 0; index < first.length; index += 1) {
    if (first[index] !== second[index]) {
      return false;
    }
  }
  
  return true;
};
