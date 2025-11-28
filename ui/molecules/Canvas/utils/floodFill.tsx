import React from 'react';
import { Image as KonvaImage } from 'react-konva';

// convert hex to rgba
const hexToRgba = (hex: string) => {
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
};

// Calculate the bounding box of the painted content by scanning the canvas
const calculatePaintedBounds = (canvas: HTMLCanvasElement): { x: number; y: number; width: number; height: number } | null => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let minX = canvas.width;
    let maxX = -1;
    let minY = canvas.height;
    let maxY = -1;

    // Scan for any non-transparent pixels
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) { // If alpha > 0
            const pixelIndex = i / 4;
            const x = pixelIndex % canvas.width;
            const y = Math.floor(pixelIndex / canvas.width);

            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
    }

    if (maxX < minX) {
        // No painted pixels found, return null
        return null;
    }

    return {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
    };
};

/**
 * Perform flood-fill on a layer using its strokes and existing image as boundaries.
 * This mutates layer state via layerControls.updateLayerRender or layerControls.rasterizeLayer.
 */
export async function floodFillLayer(
    targetLayerId: string,
    layer: any,
    layerControls: any,
    paintColor: string | undefined,
    resolveEffectiveLayerTransform: (layer: any) => any,
    stageWidth: number,
    stageHeight: number,
    stageX: number,
    stageY: number,
) {
    try {
        const targetLayer = layerControls.layers.find((l) => l.id === targetLayerId);
        if (!targetLayer) return;


        // Compute target bounds (crop area) so we preserve layer position and avoid moving strokes
        const boundsX = targetLayer.bounds?.x ?? (targetLayer.position?.x ?? 0);
        const boundsY = targetLayer.bounds?.y ?? (targetLayer.position?.y ?? 0);
        const w = Math.max(1, targetLayer.bounds?.width ?? stageWidth);
        const h = Math.max(1, targetLayer.bounds?.height ?? stageHeight);

        // Get layer scale and rotation
        const scaleX = targetLayer.scale?.x ?? 1;
        const scaleY = targetLayer.scale?.y ?? 1;
        const rotationDeg = targetLayer.rotation ?? 0;
        const rotationRad = (rotationDeg * Math.PI) / 180;

        // Transform stage coordinates to layer-local coordinates (account for scale and rotation)
        // Use the effective transform (selection proxy when transforming) so the seed maps correctly into mask/out canvases.
        const eff = resolveEffectiveLayerTransform(targetLayer);
        let localX = stageX - (eff.boundsX ?? 0);
        let localY = stageY - (eff.boundsY ?? 0);
        // Apply inverse scale
        localX /= (eff.scaleX || 1);
        localY /= (eff.scaleY || 1);
        // Apply inverse rotation
        if ((eff.rotation ?? 0) !== 0) {
            const r = (eff.rotation ?? 0) * Math.PI / 180;
            const cos = Math.cos(-r);
            const sin = Math.sin(-r);
            const x0 = localX;
            const y0 = localY;
            localX = x0 * cos - y0 * sin;
            localY = x0 * sin + y0 * cos;
        }

        // Offscreen canvases sized to layer bounds
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = w;
        maskCanvas.height = h;
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) return;

        // Draw existing raster content into mask first so previous fills act as boundaries
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

        // Draw strokes into mask. Opaque pixels will be treated as boundaries.
        const strokes = targetLayer.strokes ?? [];
        for (const s of strokes) {
            if (!s || !s.points || s.points.length < 2) continue;
            maskCtx.save();
            // Draw strokes as solid alpha (black) so alpha marks boundaries.
            if ((s as any).mode === 'erase') {
                // Eraser strokes should remove mask alpha so they open gaps in boundaries
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

        // Prepare output canvas where we'll paint fill color only on filled pixels
        const outCanvas = document.createElement('canvas');
        outCanvas.width = w;
        outCanvas.height = h;
        const outCtx = outCanvas.getContext('2d');
        if (!outCtx) return;

        // If the layer already has an image (previous fills), draw it first so we composite the new fill on top
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
        const seedX = Math.floor(localX);
        const seedY = Math.floor(localY);

        const maskData = maskCtx.getImageData(0, 0, w, h);
        const maskBuf = maskData.data;

        // Helper to test whether a pixel is boundary
        const isBoundary = (x: number, y: number) => {
            if (x < 0 || y < 0 || x >= w || y >= h) return false;
            const idx = (y * w + x) * 4 + 3;
            return maskBuf[idx] > 0;
        };

        // If seed is on boundary, we'll fill the connected boundary pixels; otherwise fill interior area.
        const seedOnBoundary = isBoundary(seedX, seedY);

        const visited = new Uint8Array(w * h);
        const stack: Array<[number, number]> = [];

        const push = (x: number, y: number) => {
            if (x < 0 || y < 0 || x >= w || y >= h) return;
            const pos = y * w + x;
            if (visited[pos]) return;
            visited[pos] = 1;
            stack.push([x, y]);
        };

        // seed validity check
        if (seedX < 0 || seedY < 0 || seedX >= w || seedY >= h) {
            // fallback to full-fill
            outCtx.fillStyle = paintColor;
            outCtx.fillRect(0, 0, w, h);
        } else {
            push(seedX, seedY);
            // We'll color selected pixels into outCtx later; for now mark visited region
            const region = new Uint8ClampedArray(w * h);
            while (stack.length > 0) {
                const [x, y] = stack.pop() as [number, number];
                const pos = y * w + x;
                // For boundary mode, we accept pixels where mask alpha > 0
                if (seedOnBoundary) {
                    if (!isBoundary(x, y)) continue;
                } else {
                    if (isBoundary(x, y)) continue;
                }
                region[pos] = 1;
                // neighbors
                push(x + 1, y);
                push(x - 1, y);
                push(x, y + 1);
                push(x, y - 1);
            }

            // Paint selected region with chosen color
            const rgba = paintColor;
            // fill a temporary ImageData with the color only on region pixels
            const outImg = outCtx.createImageData(w, h);
            const outBuf = outImg.data;

            const [rr, rg, rb, ra] = hexToRgba(rgba);

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const pos = y * w + x;
                    if (region[pos]) {
                        const di = pos * 4;
                        outBuf[di] = rr;
                        outBuf[di + 1] = rg;
                        outBuf[di + 2] = rb;
                        outBuf[di + 3] = ra;
                    }
                }
            }
            // Merge the colored region into the existing outCtx content without removing prior fills.
            try {
                const existing = outCtx.getImageData(0, 0, w, h);
                const existingBuf = existing.data;
                for (let i = 0; i < outBuf.length; i += 4) {
                    // If this pixel is part of the new region (alpha > 0 in outImg) and
                    // there is no existing pixel (alpha === 0), then copy it.
                    if (outBuf[i + 3] > 0 && existingBuf[i + 3] === 0) {
                        existingBuf[i] = outBuf[i];
                        existingBuf[i + 1] = outBuf[i + 1];
                        existingBuf[i + 2] = outBuf[i + 2];
                        existingBuf[i + 3] = outBuf[i + 3];
                    }
                }
                outCtx.putImageData(existing, 0, 0);
            } catch (e) {
                // Fallback: if getImageData fails for any reason, just put the image data.
                outCtx.putImageData(outImg, 0, 0);
            }
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
            // Trim the canvas to only include painted content
            const trimmedCanvas = document.createElement('canvas');
            trimmedCanvas.width = paintedBounds.width;
            trimmedCanvas.height = paintedBounds.height;
            const trimmedCtx = trimmedCanvas.getContext('2d');

            if (trimmedCtx) {
                trimmedCtx.drawImage(
                    outCanvas,
                    paintedBounds.x, paintedBounds.y, paintedBounds.width, paintedBounds.height,
                    0, 0, paintedBounds.width, paintedBounds.height
                );
                trimmedDataUrl = trimmedCanvas.toDataURL('image/png');
            }

            // The image should be positioned at the painted content offset within the layer
            // So, imageX and imageY are offset from the layer's bounds
            imageX = paintedBounds.x;
            imageY = paintedBounds.y;
            imageWidth = paintedBounds.width;
            imageHeight = paintedBounds.height;
            // Bounds remain at the layer's original position, but with full layer dimensions
            finalBounds = {
                x: boundsX,
                y: boundsY,
                width: w,
                height: h,
            };
        }

        // Create dataUrl and rasterize into layer (replace strokes/texts)
        const dataUrl = trimmedDataUrl;

        // To preserve previous fills, composite the new fill over the existing image
        if (layerControls.updateLayerRender) {
            if (typeof window !== 'undefined') {
                const img = new window.Image();
                img.onload = () => {
                    // Always composite into a full layer-sized canvas
                    const compositeCanvas = document.createElement('canvas');
                    compositeCanvas.width = w;
                    compositeCanvas.height = h;
                    const compositeCtx = compositeCanvas.getContext('2d');
                    if (!compositeCtx) return;

                    const currentRotation = targetLayer.rotation ?? 0;
                    const currentScale = targetLayer.scale ?? { x: 1, y: 1 };
                    const currentPosition = targetLayer.position ?? { x: boundsX, y: boundsY };

                    if (layer.imageSrc) {
                        // Draw previous image
                        const prevImg = new window.Image();
                        prevImg.onload = () => {
                            compositeCtx.clearRect(0, 0, w, h);
                            compositeCtx.drawImage(prevImg, 0, 0, w, h);
                            // Draw new fill at correct offset
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
                        prevImg.src = layer.imageSrc;
                    } else {
                        // No previous image, just use the new fill at correct offset in full layer size
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
            // last resort: call rasterizeLayer which will replace strokes/texts (not ideal)
            layerControls.rasterizeLayer(targetLayerId, dataUrl, { bounds: finalBounds });
        }
    } catch (err) {
        console.warn('Flood fill failed', err);
    }
}
