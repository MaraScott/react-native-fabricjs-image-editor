/**
 * Atomic Design - Molecule: ZoomControl
 * Zoom controls for the canvas
 */

/**
 * ZoomControlProps Interface
 * 
 * Type definition for ZoomControlProps.
 */
export interface ZoomControlProps {
  key?: string;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFit?: () => void;
  minZoom?: number;
  maxZoom?: number;
  step?: number;
}

/**
 * ZoomControl Molecule - Provides zoom in/out/reset controls
 * Displays current zoom percentage and allows adjustment
 */
export const ZoomControl = ({
  zoom,
  onZoomChange,
  onFit,
  minZoom = -100,
  maxZoom = 200,
  step = 10,
}: ZoomControlProps) => {
  const clamp = (value: number) => Math.max(minZoom, Math.min(maxZoom, value));

  const handleZoomIn = () => {
    onZoomChange(clamp(zoom + step));
  };

  const handleZoomOut = () => {
    onZoomChange(clamp(zoom - step));
  };

  const handleZoomReset = () => {
    onZoomChange(0);
    onFit?.();
  };

  const isMinZoom = zoom <= minZoom;
  const isMaxZoom = zoom >= maxZoom;

  return (
    <div
      className="zoom-control"
    >
      {/* Zoom Out Button */}
      <button
        key="zoom-out-button"
        className="zoom-out"
        onClick={handleZoomOut}
        disabled={isMinZoom}
        title="Zoom out"
      >
        −
      </button>

      {/* Zoom Display */}
      <div key="zoom-display" className="zoom-display">
        {zoom > 0 ? '+' : ''}{zoom}%
      </div>

      {/* Zoom In Button */}
      <button
        key="zoom-in-button"
        className="zoom-in"
        onClick={handleZoomIn}
        disabled={isMaxZoom}
        title="Zoom in"
      >
        +
      </button>

      {/* Reset Button */}
      <button
        key="zoom-reset-button"
        className="zoom-reset"
        onClick={handleZoomReset}
        disabled={zoom === 0}
        title="Reset zoom (fit to container)"
      >
        Fit
      </button>
    </div>
  );
};
