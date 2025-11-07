/**
 * Atomic Design - Atom: IconButton
 * A simple icon button with consistent styling
 */

import type { CSSProperties } from 'react';

export interface IconButtonProps {
  icon: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onPointerDown?: (event: React.PointerEvent<HTMLButtonElement>) => void;
  title?: string;
  'aria-label'?: string;
  'aria-pressed'?: boolean;
}

const baseStyles: CSSProperties = {
  border: '1px solid #d0d0d0',
  background: '#ffffff',
  color: '#333333',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
};

const sizeStyles = {
  small: {
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
  },
  medium: {
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
  },
  large: {
    padding: '0.75rem 1rem',
    fontSize: '1rem',
  },
};

const variantStyles = {
  primary: {
    borderColor: '#4a90e2',
    backgroundColor: '#4a90e2',
    color: '#ffffff',
  },
  secondary: {
    borderColor: '#d0d0d0',
    backgroundColor: '#ffffff',
    color: '#333333',
  },
  danger: {
    borderColor: '#d0d0d0',
    backgroundColor: '#ffffff',
    color: '#a11b1b',
  },
};

export const IconButton = ({
  icon,
  variant = 'secondary',
  size = 'small',
  disabled = false,
  ...props
}: IconButtonProps) => {
  const buttonStyles: CSSProperties = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };

  return (
    <button
      type="button"
      disabled={disabled}
      style={buttonStyles}
      {...props}
    >
      {icon}
    </button>
  );
};
