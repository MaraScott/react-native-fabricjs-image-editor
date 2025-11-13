/**
 * Atomic Design - Atom: Button
 * Basic button component with consistent styling
 */

import type { CSSProperties, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
  style?: CSSProperties;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onPointerDown?: (event: React.PointerEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
  title?: string;
}

const getVariantStyles = (variant: ButtonVariant): CSSProperties => {
  const styles: Record<ButtonVariant, CSSProperties> = {
    primary: {
      backgroundColor: '#4a90e2',
      color: '#ffffff',
      border: '1px solid #4a90e2',
    },
    secondary: {
      backgroundColor: '#ffffff',
      color: '#333333',
      border: '1px solid #d0d0d0',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#333333',
      border: '1px solid transparent',
    },
    danger: {
      backgroundColor: '#e24a4a',
      color: '#ffffff',
      border: '1px solid #e24a4a',
    },
  };
  return styles[variant];
};

const getSizeStyles = (size: ButtonSize): CSSProperties => {
  const styles: Record<ButtonSize, CSSProperties> = {
    small: {
      padding: '0.25rem 0.5rem',
      fontSize: '0.75rem',
      borderRadius: '6px',
    },
    medium: {
      padding: '0.5rem 0.75rem',
      fontSize: '0.875rem',
      borderRadius: '8px',
    },
    large: {
      padding: '0.75rem 1rem',
      fontSize: '1rem',
      borderRadius: '8px',
    },
  };
  return styles[size];
};

/**
 * Button Atom - Reusable button component
 * Provides consistent styling and behavior across the application
 */
export const Button = ({
  children,
  variant = 'secondary',
  size = 'medium',
  fullWidth = false,
  icon,
  disabled = false,
  style,
  ...props
}: ButtonProps) => {
  const baseStyles: CSSProperties = {
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: icon ? '0.5rem' : undefined,
    fontWeight: 600,
    transition: 'all 0.2s ease',
    width: fullWidth ? '100%' : undefined,
    userSelect: 'none',
    /**
     * getSizeStyles - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {size} Refer to the implementation for the precise returned value.
     */
    /**
     * getSizeStyles - Auto-generated documentation stub.
     *
     * @returns {size} Result produced by getSizeStyles.
     */
    ...getSizeStyles(size),
    /**
     * getVariantStyles - Auto-generated summary; refine if additional context is needed.
     *
     * @returns {variant} Refer to the implementation for the precise returned value.
     */
    /**
     * getVariantStyles - Auto-generated documentation stub.
     *
     * @returns {variant} Result produced by getVariantStyles.
     */
    ...getVariantStyles(variant),
    ...style,
  };

  return (
    <button
      {...props}
      disabled={disabled}
      style={baseStyles}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
};

Button.displayName = 'Button';
