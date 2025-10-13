/**
 * Atomic Design - Template: CanvasLayout
 * Layout template for the canvas application with three-zone header
 */

import type { ReactNode } from 'react';

export interface CanvasLayoutProps {
  children: ReactNode;
  headerLeft?: ReactNode;
  headerCenter?: ReactNode;
  headerRight?: ReactNode;
  footer?: ReactNode;
}

/**
 * CanvasLayout Template - Defines the overall layout structure
 * Header has three zones: left, center (for zoom controls), and right
 */
export const CanvasLayout = ({
  children,
  headerLeft,
  headerCenter,
  headerRight,
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
      {(headerLeft || headerCenter || headerRight) && (
        <div
          style={{
            padding: '1rem',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          {/* Left zone */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            {headerLeft}
          </div>

          {/* Center zone - for zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {headerCenter}
          </div>

          {/* Right zone */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            {headerRight}
          </div>
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
