/**
 * Atomic Design - Template: CanvasLayout
 * Layout template for the canvas application
 */

import type { ReactNode } from 'react';

export interface CanvasLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
}

/**
 * CanvasLayout Template - Defines the overall layout structure
 * Provides header, main content area, and optional footer
 */
export const CanvasLayout = ({
  children,
  header,
  footer,
}: CanvasLayoutProps) => {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {header && (
        <div
          style={{
            padding: '1rem',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#ffffff',
          }}
        >
          {header}
        </div>
      )}

      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {children}
      </div>

      {footer && (
        <div
          style={{
            padding: '0.5rem 1rem',
            borderTop: '1px solid #e0e0e0',
            backgroundColor: '#ffffff',
            fontSize: '0.875rem',
            color: '#666',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};
