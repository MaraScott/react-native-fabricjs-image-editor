/**
 * Atomic Design - Atom: LayerToggleButton
 * A specialized button for toggling the layer panel
 */

import type { CSSProperties } from 'react';

export interface LayerToggleButtonProps {
  isOpen: boolean;
  onClick: () => void;
  onPointerDown?: (event: React.PointerEvent<HTMLButtonElement>) => void;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

export const LayerToggleButton = ({
  isOpen,
  onClick,
  onPointerDown,
  buttonRef,
}: LayerToggleButtonProps) => {
  const buttonStyles: CSSProperties = {
    position: 'absolute',
    left: '16px',
    bottom: '16px',
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    border: '1px solid #d0d0d0',
    backgroundColor: isOpen ? '#333333' : '#ffffff',
    color: isOpen ? '#ffffff' : '#333333',
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    cursor: 'pointer',
    zIndex: 12,
    transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-expanded={isOpen}
      aria-label={isOpen ? 'Hide layer controls' : 'Show layer controls'}
      title={isOpen ? 'Hide layer controls' : 'Show layer controls'}
      onClick={onClick}
      onPointerDown={onPointerDown}
      style={buttonStyles}
    >
      ☰
    </button>
  );
};
