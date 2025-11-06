import React from 'react';
import type { CSSProperties } from 'react';

export type OverlayBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
};

interface Props {
  box: OverlayBox;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onResizePointerDown?: (direction: string, e: React.PointerEvent<HTMLDivElement>) => void;
  onRotatePointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
}

const handleStyle: CSSProperties = {
  position: 'absolute',
  width: '12px',
  height: '12px',
  background: '#00f6ff',
  borderRadius: '2px',
  transform: 'translate(-50%, -50%)',
  zIndex: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
};

export const OverlaySelection = ({
  box,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onResizePointerDown,
  onRotatePointerDown,
}: Props): JSX.Element => {
  const { x, y, width, height, rotation = 0 } = box;

  const containerStyle: CSSProperties = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
    transformOrigin: 'center center',
    pointerEvents: 'auto',
    boxSizing: 'border-box',
    zIndex: 15,
    border: `2px dashed #00f6ff`,
    background: 'transparent',
    cursor: 'grab',
  };

  const mkHandle = (leftPct: number, topPct: number, dir: string) => (
    <div
      onPointerDown={(e) => { e.stopPropagation(); onResizePointerDown?.(dir, e); }}
      style={{ ...handleStyle, left: `${leftPct}%`, top: `${topPct}%`, cursor: `${dir}-resize` }}
      role="button"
      aria-label={`resize-${dir}`}
    />
  );

  return (
    <div
      style={containerStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* corners */}
      {mkHandle(0, 0, 'nw')}
      {mkHandle(100, 0, 'ne')}
      {mkHandle(0, 100, 'sw')}
      {mkHandle(100, 100, 'se')}

      {/* edges */}
      {mkHandle(50, 0, 'n')}
      {mkHandle(100, 50, 'e')}
      {mkHandle(50, 100, 's')}
      {mkHandle(0, 50, 'w')}

      {/* rotate handle (above top center) */}
      <div
        onPointerDown={(e) => { e.stopPropagation(); onRotatePointerDown?.(e); }}
        style={{ ...handleStyle, left: '50%', top: '-12px', background: '#ffffff', border: '2px solid #00f6ff', cursor: 'grab' }}
        role="button"
        aria-label="rotate-handle"
      />
    </div>
  );
};

export default OverlaySelection;
