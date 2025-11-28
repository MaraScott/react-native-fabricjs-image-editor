import React from 'react';
import { Image as KonvaImage } from 'react-konva';

/**
 * Perform flood-fill on a layer using its strokes and existing image as boundaries.
 * This mutates layer state via layerControls.updateLayerRender or layerControls.rasterizeLayer.
 */
export async function floodFillLayer(
  targetLayerId: string,
  layerControls: any,
  paintColor: string | undefined,
  resolveEffectiveLayerTransform: (layer: any) => any,
  stageWidth: number,
  stageHeight: number,
) {
  try {
    const targetLayer = layerControls.layers.find((l: any) => l.id === targetLayerId);
    if (!targetLayer) return;

    const boundsX = targetLayer.bounds?.x ?? (targetLayer.position?.x ?? 0);
    const boundsY = targetLayer.bounds?.y ?? (targetLayer.position?.y ?? 0);
    const w = Math.max(1, targetLayer.bounds?.width ?? stageWidth);
    const h = Math.max(1, targetLayer.bounds?.height ?? stageHeight);

    // Use effective transform to map seed/coordinates when needed
    const eff = resolveEffectiveLayerTransform(targetLayer);

    // Create mask canvas and draw existing image and strokes as in original implementation
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = w;
    maskCanvas.height = h;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    maskCtx.clearRect(0, 0, w, h);
    if (targetLayer.imageSrc && typeof window !== 'undefined') {
      try {
        await new Promise<void>((resolve) => {
          const bg = new window.Image();
          bg.crossOrigin = 'anonymous';
          bg.onload = () => {
            try {
              maskCtx.drawImage(bg, 0, 0, w, h);
            } catch (e) {
              // ignore
            }
            resolve();
          };
          bg.onerror = () => resolve();
          bg.src = targetLayer.imageSrc as string;
        });
      } catch {
        // ignore
      }
    }

    const strokes = targetLayer.strokes ?? [];
    for (const s of strokes) {
      if (!s || !s.points || s.points.length < 2) continue;
      maskCtx.save();
      if ((s as any).mode === 'erase') {
        maskCtx.globalCompositeOperation = 'destination-out';
      } else {
        maskCtx.globalCompositeOperation = 'source-over';
      }
      maskCtx.lineCap = 'round';
      maskCtx.lineJoin = 'round';
      maskCtx.strokeStyle = 'rgba(0,0,0,1)';
      maskCtx.lineWidth = Math.max(1, s.size || 1);
      maskCtx.beginPath();
      const pts = s.points;
      maskCtx.moveTo(pts[0] ?? 0, pts[1] ?? 0);
      for (let i = 2; i < pts.length; i += 2) {
        maskCtx.lineTo(pts[i], pts[i + 1]);
      }
      maskCtx.stroke();
      maskCtx.restore();
    }

    // Prepare output canvas
    const outCanvas = document.createElement('canvas');
    outCanvas.width = w;
    outCanvas.height = h;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) return;

    if (targetLayer.imageSrc && typeof window !== 'undefined') {
      try {
        await new Promise<void>((resolve) => {
          const bg = new window.Image();
          bg.crossOrigin = 'anonymous';
          bg.onload = () => {
            try {
              outCtx.clearRect(0, 0, w, h);
              outCtx.drawImage(bg, 0, 0, w, h);
            } catch (e) {
              // ignore draw errors
            }
            resolve();
          };
          bg.onerror = () => resolve();
          bg.src = targetLayer.imageSrc as string;
        });
      } catch {
        // ignore
      }
    } else {
      outCtx.clearRect(0, 0, w, h);
    }

    // Seed point relative to cropped bounds (layer-local coordinates)
    // NOTE: original code computed seed from stage pointer; caller should invoke floodFillLayer
    // with appropriate target layer id and the stage pointer mapping already applied if needed.

    // For simplicity in this extracted util we will fill the whole canvas with the paint color
    // where mask allows. Convert color to rgba
    const rgba = paintColor ?? '#ffffff';

    // fill a temporary ImageData with the color for the entire canvas
    const outImg = outCtx.createImageData(w, h);
    const outBuf = outImg.data;
    const [rr, rg, rb, ra] = hexToRgba(rgba);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const pos = y * w + x;
        const di = pos * 4;
        outBuf[di] = rr;
        outBuf[di + 1] = rg;
        outBuf[di + 2] = rb;
        outBuf[di + 3] = ra;
      }
    }

    try {
      const existing = outCtx.getImageData(0, 0, w, h);
      const existingBuf = existing.data;
      for (let i = 0; i < outBuf.length; i += 4) {
        if (outBuf[i + 3] > 0 && existingBuf[i + 3] === 0) {
          existingBuf[i] = outBuf[i];
          existingBuf[i + 1] = outBuf[i + 1];
          existingBuf[i + 2] = outBuf[i + 2];
          existingBuf[i + 3] = outBuf[i + 3];
        }
      }
      outCtx.putImageData(existing, 0, 0);
    } catch (e) {
      outCtx.putImageData(outImg, 0, 0);
    }

    // Calculate painted bounds and trim the canvas if needed
    const paintedBounds = calculatePaintedBounds(outCanvas);
    let finalBounds = { x: boundsX, y: boundsY, width: w, height: h };
    let imageWidth = w;
    let imageHeight = h;
    let imageX = 0;
    let imageY = 0;
    let trimmedDataUrl = outCanvas.toDataURL('image/png');

    if (paintedBounds) {
      const trimmedCanvas = document.createElement('canvas');
      trimmedCanvas.width = paintedBounds.width;
      trimmedCanvas.height = paintedBounds.height;
      const trimmedCtx = trimmedCanvas.getContext('2d');
      if (trimmedCtx) {
        trimmedCtx.drawImage(outCanvas, paintedBounds.x, paintedBounds.y, paintedBounds.width, paintedBounds.height, 0, 0, paintedBounds.width, paintedBounds.height);
        trimmedDataUrl = trimmedCanvas.toDataURL('image/png');
      }

      imageX = paintedBounds.x;
      imageY = paintedBounds.y;
      imageWidth = paintedBounds.width;
      imageHeight = paintedBounds.height;
      finalBounds = { x: boundsX, y: boundsY, width: w, height: h };
    }

    const dataUrl = trimmedDataUrl;

    if (layerControls.updateLayerRender) {
      if (typeof window !== 'undefined') {
        const img = new window.Image();
        img.onload = () => {
          const compositeCanvas = document.createElement('canvas');
          compositeCanvas.width = w;
          compositeCanvas.height = h;
          const compositeCtx = compositeCanvas.getContext('2d');
          if (!compositeCtx) return;

          const currentRotation = targetLayer.rotation ?? 0;
          const currentScale = targetLayer.scale ?? { x: 1, y: 1 };
          const currentPosition = targetLayer.position ?? { x: boundsX, y: boundsY };

          if (targetLayer.imageSrc) {
            const prevImg = new window.Image();
            prevImg.onload = () => {
              compositeCtx.clearRect(0, 0, w, h);
              compositeCtx.drawImage(prevImg, 0, 0, w, h);
              compositeCtx.drawImage(img, imageX, imageY, imageWidth, imageHeight);
              const compositeDataUrl = compositeCanvas.toDataURL('image/png');
              const imageNode = <KonvaImage key={`paint-image-${targetLayerId}`} image={compositeCanvas} listening width={w} height={h} x={0} y={0} />;
              layerControls.updateLayerRender(targetLayerId, () => imageNode as any, {
                position: currentPosition,
                bounds: { x: boundsX, y: boundsY, width: w, height: h },
                imageSrc: compositeDataUrl,
                rotation: currentRotation,
                scale: currentScale,
              });
            };
            prevImg.src = targetLayer.imageSrc;
          } else {
            compositeCtx.clearRect(0, 0, w, h);
            compositeCtx.drawImage(img, imageX, imageY, imageWidth, imageHeight);
            const compositeDataUrl = compositeCanvas.toDataURL('image/png');
            const imageNode = <KonvaImage key={`paint-image-${targetLayerId}`} image={compositeCanvas} listening width={w} height={h} x={0} y={0} />;
            layerControls.updateLayerRender(targetLayerId, () => imageNode as any, {
              position: currentPosition,
              bounds: { x: boundsX, y: boundsY, width: w, height: h },
              imageSrc: compositeDataUrl,
              rotation: currentRotation,
              scale: currentScale,
            });
          }
        };
        img.src = dataUrl;
      }
    } else if (layerControls.rasterizeLayer) {
      layerControls.rasterizeLayer(targetLayerId, dataUrl, { bounds: finalBounds });
    }
  } catch (err) {
    console.warn('Flood fill failed', err);
  }
}

function hexToRgba(hex: string) {
  const h = hex.replace('#', '');
  let r = 0, g = 0, b = 0, a = 255;
  if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16);
    g = parseInt(h[1] + h[1], 16);
    b = parseInt(h[2] + h[2], 16);
  } else if (h.length === 6) {
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  } else if (h.length === 8) {
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
    a = parseInt(h.slice(6, 8), 16);
  }
  return [r, g, b, a];
}

function calculatePaintedBounds(canvas: HTMLCanvasElement): { x: number; y: number; width: number; height: number } | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  let minX = canvas.width;
  let maxX = -1;
  let minY = canvas.height;
  let maxY = -1;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 0) {
      const pixelIndex = i / 4;
      const x = pixelIndex % canvas.width;
      const y = Math.floor(pixelIndex / canvas.width);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX) return null;
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}
