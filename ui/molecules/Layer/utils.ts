/**
 * Layer Panel Utilities
 *
 * Utility functions for layer management
 */

import React from 'react';
import { Image as KonvaImage } from 'react-konva';
import type { LayerDescriptor } from '@molecules/Canvas';
import type { InitialLayerDefinition } from '@molecules/Layer/Layer.types';
import type { Bounds } from '@molecules/Canvas/types/canvas.types';

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

export interface TrimmedImageResult {
  dataUrl: string;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

export const trimTransparentImage = (
  image: HTMLImageElement,
  drawWidth: number,
  drawHeight: number
): TrimmedImageResult | null => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(drawWidth));
  canvas.height = Math.max(1, Math.floor(drawHeight));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha !== 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX === -1 || maxY === -1) {
    return null;
  }

  const trimmedWidth = maxX - minX + 1;
  const trimmedHeight = maxY - minY + 1;
  const trimmedCanvas = document.createElement('canvas');
  trimmedCanvas.width = trimmedWidth;
  trimmedCanvas.height = trimmedHeight;
  const trimmedCtx = trimmedCanvas.getContext('2d');
  if (!trimmedCtx) return null;
  trimmedCtx.drawImage(canvas, -minX, -minY);

  return {
    dataUrl: trimmedCanvas.toDataURL('image/png', 1),
    offsetX: minX,
    offsetY: minY,
    width: trimmedWidth,
    height: trimmedHeight,
  };
};

/**
 * Normalize layer definitions
 *
 * Converts InitialLayerDefinition objects to LayerDescriptor objects with default values.
 * If an imageSrc is provided, a KonvaImage render function is generated.
 *
 * @param {InitialLayerDefinition[]} definitions - Array of layer definitions to normalize
 * @returns {LayerDescriptor[]} Normalized layer descriptors
 */
export const normaliseLayerDefinitions = (
  definitions: InitialLayerDefinition[]
): LayerDescriptor[] => {
  return definitions.map((definition, index) => {
    const base: LayerDescriptor = {
      id: definition.id ?? generateLayerId(),
      name: definition.name ?? `Layer ${index + 1}`,
      visible: definition.visible ?? true,
      position: definition.position ?? { x: 0, y: 0 },
      rotation: definition.rotation ?? 0,
      scale: definition.scale ?? { x: 1, y: 1 },
      opacity: definition.opacity ?? 1,
      strokes: definition.strokes ? definition.strokes.map((stroke) => ({ ...stroke, points: [...stroke.points] })) : [],
      texts: definition.texts ? definition.texts.map((text) => ({ ...text })) : [],
      render: definition.render,
      imageSrc: definition.imageSrc,
    };

    let hasTrimmed = false;

    if (!base.render) {
      if (definition.imageSrc && typeof window !== 'undefined') {
        const img = new window.Image();

        // Lazily resolve the intrinsic size once the image has actually loaded.
        img.onload = () => {
          if (hasTrimmed) {
            // Second onload after trimming; just refresh measurements.
            try {
              window.dispatchEvent(new CustomEvent('layer-move-refresh', { detail: { layerIds: [base.id] } }));
            } catch {
              // ignore
            }
            return;
          }

          const naturalWidth = img.naturalWidth || img.width || 1;
          const naturalHeight = img.naturalHeight || img.height || 1;
          const width = definition.bounds?.width ?? naturalWidth;
          const height = definition.bounds?.height ?? naturalHeight;

          // If bounds were not provided in the imported JSON, populate them from the image.
          if (!base.bounds) {
            base.bounds = {
              x: base.position.x,
              y: base.position.y,
              width,
              height,
            };
          }

          const trimmed = trimTransparentImage(img, base.bounds.width, base.bounds.height);
          if (trimmed) {
            hasTrimmed = true;
            base.position = { x: base.position.x + trimmed.offsetX, y: base.position.y + trimmed.offsetY };
            base.bounds = {
              x: base.position.x,
              y: base.position.y,
              width: trimmed.width,
              height: trimmed.height,
            };
            base.imageSrc = trimmed.dataUrl;
            img.src = trimmed.dataUrl;
            return;
          }

          // Force the canvas to re-measure so the newly known size is applied.
          try {
            window.dispatchEvent(new CustomEvent('layer-move-refresh', { detail: { layerIds: [base.id] } }));
          } catch {
            // ignore
          }
        };

        img.src = definition.imageSrc;

        base.render = () =>
          React.createElement(KonvaImage, {
            image: img,
            // If bounds exist, respect them; otherwise let Konva use the image's intrinsic size.
            width: base.bounds?.width,
            height: base.bounds?.height,
            x: 0,
            y: 0,
            listening: true,
            onLoad: (e) => e.target?.getLayer()?.batchDraw?.(),
          });
      } else {
        base.render = () => null;
      }
    }

    return base;
  });
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
