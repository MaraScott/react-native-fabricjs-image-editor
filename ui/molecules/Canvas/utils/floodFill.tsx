import type { LayerElementTransform, LayerPaintShape, LayerStroke } from '@molecules/Layer/Layer.types';
import { buildLayerTransformFromEffective } from "@molecules/Canvas/hooks/useDrawingTools";


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

const isolateMaskEdges = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!ctx || width <= 0 || height <= 0) return;

    try {
        const maskData = ctx.getImageData(0, 0, width, height);
        const maskBuf = maskData.data;
        const boundary = new Uint8Array(width * height);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pos = y * width + x;
                const alphaIdx = pos * 4 + 3;
                if (maskBuf[alphaIdx] === 0) {
                    continue;
                }

                let isEdge = false;
                if (x > 0 && maskBuf[alphaIdx - 4] === 0) isEdge = true;
                if (x < width - 1 && maskBuf[alphaIdx + 4] === 0) isEdge = true;
                if (y > 0 && maskBuf[alphaIdx - width * 4] === 0) isEdge = true;
                if (y < height - 1 && maskBuf[alphaIdx + width * 4] === 0 && !isEdge) isEdge = true;

                if (isEdge) {
                    boundary[pos] = 1;
                }
            }
        }

        for (let pos = 0; pos < width * height; pos++) {
            const idx = pos * 4;
            maskBuf[idx] = 0;
            maskBuf[idx + 1] = 0;
            maskBuf[idx + 2] = 0;
            maskBuf[idx + 3] = boundary[pos] ? 255 : 0;
        }

        ctx.putImageData(maskData, 0, 0);
    } catch {
        // ignore cross-origin or rendering errors
    }
};

export function createPaintStroke(color: string, shape: LayerPaintShape): LayerStroke {
    return {
        id: `paint-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        points: [],
        color,
        size: 0,
        hardness: 1,
        opacity: 1,
        mode: "paint",
        paintShape: shape,
        layerTransform: shape.layerTransform,
    };
};

export function getFillCanvas(width: number, height: number, fillColor: string): { fillCanvas: HTMLCanvasElement; fillCtx: CanvasRenderingContext2D } {

    const fillCanvas = document.createElement("canvas");
    fillCanvas.width = Math.max(1, width);
    fillCanvas.height = Math.max(1, height);
    const fillCtx = fillCanvas.getContext("2d");
    if (!fillCtx) return;
    fillCtx.fillStyle = fillColor;
    fillCtx.fillRect(
        0,
        0,
        fillCanvas.width,
        fillCanvas.height
    );

    return { fillCanvas, fillCtx };

}

export function getPaintShape(fillCanvas: HTMLCanvasElement, dataUrl: string, bounds: { x: number, y: number }, fillColor: string, paintLayer: any, paintLayerTransform: LayerElementTransform): LayerPaintShape {
    console.log('fillCanvas', fillCanvas, 'dataUrl', dataUrl);
    return {
        id: `paint-shape-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,
        type: "paint",
        imageSrc: dataUrl ?? fillCanvas.toDataURL("image/png"),
        bounds: {
            x: bounds.x,
            y: bounds.y,
            width: fillCanvas.width,
            height: fillCanvas.height,
        },
        fill: fillColor,
        opacity: 1,
        transform: {
            rotation: paintLayer.rotation ?? 0,
            scaleX: paintLayer.scale?.x ?? 1,
            scaleY: paintLayer.scale?.y ?? 1,
        },
        layerTransform: paintLayerTransform,
    }
};

const drawShapesOntoContext = async (
    ctx: CanvasRenderingContext2D,
    strokes?: LayerStroke[]
) => {
    if (!strokes || strokes.length === 0 || typeof window === 'undefined') {
        return;
    }

    for (const stroke of strokes) {
        const shape = stroke.paintShape;
        if (!shape || !shape.imageSrc || shape.bounds.width <= 0 || shape.bounds.height <= 0) {
            continue;
        }

        await new Promise<void>((resolve) => {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    ctx.drawImage(
                        img,
                        shape.bounds.x,
                        shape.bounds.y,
                        shape.bounds.width,
                        shape.bounds.height
                    );
                } catch {
                    // ignore draw errors
                }
                resolve();
            };
            img.onerror = () => resolve();
            img.src = shape.imageSrc;
        });
    }
};

export function getTrimmedDataUrl(canvas: HTMLCanvasElement, fullWidth: number, fullHeight: number): { trimmedDataUrl: string; imageX: number; imageY: number; imageWidth: number; imageHeight: number } {
    // Calculate painted bounds and trim the canvas if needed
    const paintedBounds = calculatePaintedBounds(canvas);
    let imageWidth = fullWidth;
    let imageHeight = fullHeight;
    let imageX = 0;
    let imageY = 0;
    let trimmedDataUrl = canvas.toDataURL('image/png');

    if (paintedBounds) {
        // Trim the canvas to only include painted content
        const trimmedCanvas = document.createElement('canvas');
        trimmedCanvas.width = paintedBounds.width;
        trimmedCanvas.height = paintedBounds.height;
        const trimmedCtx = trimmedCanvas.getContext('2d');

        if (trimmedCtx) {
            trimmedCtx.drawImage(
                canvas,
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
    }

    return { trimmedDataUrl, imageX, imageY, imageWidth, imageHeight };
}

function getPaintedCanvas(w: number, h: number, localX: number, localY: number, maskCtx: CanvasRenderingContext2D, paintColor: string) {
    // Prepare output canvas where we'll paint fill color only on filled pixels
    const outCanvas = document.createElement('canvas');
    outCanvas.width = w;
    outCanvas.height = h;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) return;
    outCtx.clearRect(0, 0, w, h);

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
                if (outBuf[i + 3] > 0) {
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

    return { canvas: outCanvas, ctx: outCtx };
}

async function getMaskCtx(w: number, h: number, eff?: any, targetLayer?: any, stageWidth?: number, stageHeight?: number) {

    // Offscreen canvases sized to layer bounds
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = w;
    maskCanvas.height = h;

    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    // Draw existing paint shapes into mask so previous fills act as boundaries
    maskCtx.clearRect(0, 0, w, h);
    await drawShapesOntoContext(maskCtx, targetLayer.strokes);
    isolateMaskEdges(maskCtx, w, h);

    // Draw strokes into mask. Opaque pixels will be treated as boundaries.
    const strokes = targetLayer.strokes ?? [];
    const transformStrokePoints = (points: number[]) => {
        if (!points || points.length < 2) return points;

        const maxCoord = Math.max(...points.map((value) => Math.abs(value)));
        const scaleThreshold = Math.max(stageWidth, stageHeight) * 2;
        if (maxCoord <= scaleThreshold) {
            return points;
        }

        const rotationDeg = eff.rotation ?? 0;
        const rotationRad = (rotationDeg * Math.PI) / 180;
        const cos = Math.cos(-rotationRad);
        const sin = Math.sin(-rotationRad);

        const normalized: number[] = [];
        for (let i = 0; i < points.length; i += 2) {
            let px = points[i];
            let py = points[i + 1];
            let nx = px - (eff.boundsX ?? 0);
            let ny = py - (eff.boundsY ?? 0);
            if (rotationDeg !== 0) {
                const ox = nx;
                const oy = ny;
                nx = ox * cos - oy * sin;
                ny = ox * sin + oy * cos;
            }
            nx /= eff.scaleX || 1;
            ny /= eff.scaleY || 1;
            normalized.push(nx, ny);
        }
        return normalized;
    };
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
        const pts = transformStrokePoints(s.points);
        maskCtx.moveTo(pts[0] ?? 0, pts[1] ?? 0);
        for (let i = 2; i < pts.length; i += 2) {
            maskCtx.lineTo(pts[i], pts[i + 1]);
        }
        maskCtx.stroke();
        maskCtx.restore();
    }
    return maskCtx;
}


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
        console.log('targetLayer', JSON.stringify(targetLayer));
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
        const layerTransform = buildLayerTransformFromEffective(eff);
        const maskCtx = await getMaskCtx(w, h, eff, targetLayer, stageWidth, stageHeight);
        const { canvas: outCanvas, ctx: outCtx } = getPaintedCanvas(w, h, localX, localY, maskCtx, paintColor ?? '#000000');
        const { trimmedDataUrl, imageWidth, imageHeight, imageX, imageY } = getTrimmedDataUrl(outCanvas, w, h);
        const dataUrl = trimmedDataUrl;
        const fillColor = paintColor ?? '#000000';
        const { fillCanvas, fillCtx } = getFillCanvas(imageWidth, imageHeight, fillColor);
        console.log('floodFill');
        const paintShape = getPaintShape(fillCanvas, dataUrl, { x: imageX, y: imageY }, fillColor, targetLayer, layerTransform);
        // test paintShape with HEAD~2
        const paintStroke = createPaintStroke(fillColor, paintShape);
        const nextStrokes = [...(targetLayer.strokes ?? []), paintStroke];
        layerControls.updateLayerStrokes?.(targetLayerId, nextStrokes);

    } catch (err) {
        console.warn('Flood fill failed', err);
    }
}
