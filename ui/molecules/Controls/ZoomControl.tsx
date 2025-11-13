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
  /**
   * handleZoomIn - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * handleZoomIn - Auto-generated documentation stub.
   */
  const handleZoomIn = () => {
    /**
     * min - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} maxZoom - Parameter derived from the static analyzer.
     * @param {*} zoom + step - Parameter derived from the static analyzer.
     *
     * @returns {maxZoom, zoom + step} Refer to the implementation for the precise returned value.
     */
    /**
     * min - Auto-generated documentation stub.
     *
     * @param {*} maxZoom - Parameter forwarded to min.
     * @param {*} zoom + step - Parameter forwarded to min.
     *
     * @returns {maxZoom, zoom + step} Result produced by min.
     */
    const newZoom = Math.min(maxZoom, zoom + step);
    /**
     * onZoomChange - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {newZoom} Refer to the implementation for the precise returned value.
     */
    /**
     * onZoomChange - Auto-generated documentation stub.
     *
     * @returns {newZoom} Result produced by onZoomChange.
     */
    onZoomChange(newZoom);
  };

  /**
   * handleZoomOut - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * handleZoomOut - Auto-generated documentation stub.
   */
  const handleZoomOut = () => {
    /**
     * max - Auto-generated summary; refine if additional context is needed.
     *
     * @param {*} minZoom - Parameter derived from the static analyzer.
     * @param {*} zoom - step - Parameter derived from the static analyzer.
     *
     * @returns {minZoom, zoom - step} Refer to the implementation for the precise returned value.
     */
    /**
     * max - Auto-generated documentation stub.
     *
     * @param {*} minZoom - Parameter forwarded to max.
     * @param {*} zoom - step - Parameter forwarded to max.
     *
     * @returns {minZoom, zoom - step} Result produced by max.
     */
    const newZoom = Math.max(minZoom, zoom - step);
    /**
     * onZoomChange - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {newZoom} Refer to the implementation for the precise returned value.
     */
    /**
     * onZoomChange - Auto-generated documentation stub.
     *
     * @returns {newZoom} Result produced by onZoomChange.
     */
    onZoomChange(newZoom);
  };

  /**
   * handleZoomReset - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * handleZoomReset - Auto-generated documentation stub.
   */
  const handleZoomReset = () => {
    /**
     * onZoomChange - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {0} Refer to the implementation for the precise returned value.
     */
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
          /**
           * if - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {!isMinZoom} Refer to the implementation for the precise returned value.
           */
          /**
           * if - Auto-generated documentation stub.
           *
           * @returns {!isMinZoom} Result produced by if.
           */
          if (!isMinZoom) {
            /**
             * assign - Auto-generated summary; refine if additional context is needed.
             *
             * @param {*} e.currentTarget.style - Parameter derived from the static analyzer.
             * @param {*} buttonHoverStyle - Parameter derived from the static analyzer.
             *
             * @returns {e.currentTarget.style, buttonHoverStyle} Refer to the implementation for the precise returned value.
             */
            /**
             * assign - Auto-generated documentation stub.
             *
             * @param {*} e.currentTarget.style - Parameter forwarded to assign.
             * @param {*} buttonHoverStyle - Parameter forwarded to assign.
             *
             * @returns {e.currentTarget.style, buttonHoverStyle} Result produced by assign.
             */
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
          /**
           * if - Auto-generated summary; refine if additional context is needed.
           *
           * @returns {!isMaxZoom} Refer to the implementation for the precise returned value.
           */
          /**
           * if - Auto-generated documentation stub.
           *
           * @returns {!isMaxZoom} Result produced by if.
           */
          if (!isMaxZoom) {
            /**
             * assign - Auto-generated summary; refine if additional context is needed.
             *
             * @param {*} e.currentTarget.style - Parameter derived from the static analyzer.
             * @param {*} buttonHoverStyle - Parameter derived from the static analyzer.
             *
             * @returns {e.currentTarget.style, buttonHoverStyle} Refer to the implementation for the precise returned value.
             */
            /**
             * assign - Auto-generated documentation stub.
             *
             * @param {*} e.currentTarget.style - Parameter forwarded to assign.
             * @param {*} buttonHoverStyle - Parameter forwarded to assign.
             *
             * @returns {e.currentTarget.style, buttonHoverStyle} Result produced by assign.
             */
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
          /**
           * if - Auto-generated summary; refine if additional context is needed.
           */
          /**
           * if - Auto-generated documentation stub.
           */
          if (zoom !== 0) {
            /**
             * assign - Auto-generated summary; refine if additional context is needed.
             *
             * @param {*} e.currentTarget.style - Parameter derived from the static analyzer.
             * @param {*} buttonHoverStyle - Parameter derived from the static analyzer.
             *
             * @returns {e.currentTarget.style, buttonHoverStyle} Refer to the implementation for the precise returned value.
             */
            /**
             * assign - Auto-generated documentation stub.
             *
             * @param {*} e.currentTarget.style - Parameter forwarded to assign.
             * @param {*} buttonHoverStyle - Parameter forwarded to assign.
             *
             * @returns {e.currentTarget.style, buttonHoverStyle} Result produced by assign.
             */
            Object.assign(e.currentTarget.style, buttonHoverStyle);
          }
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, {
            backgroundColor: '#fff',
            borderColor: '#ddd',
          });
        }}
        /**
         * zoom - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {fit to container} Refer to the implementation for the precise returned value.
         */
        /**
         * zoom - Auto-generated documentation stub.
         *
         * @returns {fit to container} Result produced by zoom.
         */
        title="Reset zoom (fit to container)"
      >
        Fit
      </button>
    </div>
  );
};
