/**
 * Atomic Design - Atom: FeedbackMessage
 * Displays temporary feedback messages
 */

import type { CSSProperties } from 'react';

export interface FeedbackMessageProps {
  message: string;
  variant?: 'success' | 'error' | 'info';
}

const baseStyles: CSSProperties = {
  fontSize: '0.75rem',
  padding: '0.35rem 0.5rem',
  borderRadius: '6px',
  transition: 'opacity 0.2s ease',
};

const variantStyles = {
  success: {
    color: '#2d7a2d',
    backgroundColor: '#ecf7ec',
  },
  error: {
    color: '#a11b1b',
    backgroundColor: '#ffeaea',
  },
  info: {
    color: '#2d4a7a',
    backgroundColor: '#e8f0ff',
  },
};

export const FeedbackMessage = ({
  message,
  variant = 'success',
}: FeedbackMessageProps) => {
  const messageStyles: CSSProperties = {
    ...baseStyles,
    ...variantStyles[variant],
  };

  return <div style={messageStyles}>{message}</div>;
};
