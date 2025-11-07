/**
 * Clamp a zoom value between min and max bounds
 */
export const clampZoomValue = (value: number, min: number = -100, max: number = 200): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Calculate scale from zoom value
 */
export const calculateScaleFromZoom = (
  zoom: number,
  containerWidth: number,
  containerHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  minEffectiveScale: number = 0.05
): number => {
  const scaleX = containerWidth / canvasWidth;
  const scaleY = containerHeight / canvasHeight;
  const fitScale = Math.min(scaleX, scaleY);

  const zoomFactor = 1 + zoom / 100;
  return Math.max(fitScale * zoomFactor, minEffectiveScale);
};

/**
 * Get the distance between two touch points
 */
export const getTouchDistance = (touches: TouchList): number => {
  if (touches.length < 2) return 0;

  const touchOne = touches[0];
  const touchTwo = touches[1];

  const dx = touchTwo.clientX - touchOne.clientX;
  const dy = touchTwo.clientY - touchOne.clientY;

  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Get the center point of multiple touches
 */
export const getTouchCenter = (touches: TouchList): { x: number; y: number } => {
  let sumX = 0;
  let sumY = 0;
  const count = touches.length;

  for (let index = 0; index < count; index += 1) {
    const touch = touches[index];
    sumX += touch.clientX;
    sumY += touch.clientY;
  }

  return {
    x: sumX / count,
    y: sumY / count,
  };
};
