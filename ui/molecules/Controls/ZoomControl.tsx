/**
 * Atomic Design - Molecule: ZoomControl
 * Zoom controls for the canvas
 */

export interface ZoomControlProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
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
  minZoom = -100,
  maxZoom = -1 * minZoom,
  step = 10,
}: ZoomControlProps) => {
  const handleZoomIn = () => {
    const newZoom = Math.min(maxZoom, zoom + step);
    onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(minZoom, zoom - step);
    onZoomChange(newZoom);
  };

  const handleZoomReset = () => {
    onZoomChange(0);
  };

  const buttonStyle = {
    padding: '0.5rem 0.75rem',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#333',
    transition: 'all 0.2s',
    userSelect: 'none' as const,
  };

  const buttonHoverStyle = {
    backgroundColor: '#f5f5f5',
    borderColor: '#999',
  };

  const disabledStyle = {
    opacity: 0.5,
    cursor: 'not-allowed',
  };

  const zoomDisplayStyle = {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#333',
    minWidth: '80px',
    textAlign: 'center' as const,
  };

  const isMinZoom = zoom <= minZoom;
  const isMaxZoom = zoom >= maxZoom;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      {/* Zoom Out Button */}
      <button
        onClick={handleZoomOut}
        disabled={isMinZoom}
        style={{
          ...buttonStyle,
          borderTop: 'none',
          borderLeft: 'none',
          borderBottom: 'none',
          borderRadius: 0,
          ...(isMinZoom && disabledStyle),
        }}
        onMouseEnter={(e) => {
          if (!isMinZoom) {
            Object.assign(e.currentTarget.style, buttonHoverStyle);
          }
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, {
            backgroundColor: '#fff',
            borderColor: '#ddd',
          });
        }}
        title="Zoom out"
      >
        −
      </button>

      {/* Zoom Display */}
      <div style={zoomDisplayStyle}>
        {zoom > 0 ? '+' : ''}{zoom}%
      </div>

      {/* Zoom In Button */}
      <button
        onClick={handleZoomIn}
        disabled={isMaxZoom}
        style={{
          ...buttonStyle,
          borderTop: 'none',
          borderBottom: 'none',
          borderRadius: 0,
          ...(isMaxZoom && disabledStyle),
        }}
        onMouseEnter={(e) => {
          if (!isMaxZoom) {
            Object.assign(e.currentTarget.style, buttonHoverStyle);
          }
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, {
            backgroundColor: '#fff',
            borderColor: '#ddd',
          });
        }}
        title="Zoom in"
      >
        +
      </button>

      {/* Reset Button */}
      <button
        onClick={handleZoomReset}
        disabled={zoom === 0}
        style={{
          ...buttonStyle,
          borderTop: 'none',
          borderRight: 'none',
          borderBottom: 'none',
          borderRadius: 0,
          fontSize: '0.75rem',
          ...(zoom === 0 && disabledStyle),
        }}
        onMouseEnter={(e) => {
          if (zoom !== 0) {
            Object.assign(e.currentTarget.style, buttonHoverStyle);
          }
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, {
            backgroundColor: '#fff',
            borderColor: '#ddd',
          });
        }}
        title="Reset zoom (fit to container)"
      >
        Fit
      </button>
    </div>
  );
};
