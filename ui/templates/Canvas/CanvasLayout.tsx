/**
 * Atomic Design - Template: CanvasLayout
 * Layout template for the canvas application with three-zone header
 */

import React, { isValidElement } from 'react';
import type { ReactNode } from 'react';
import '../../../assets/public/css/tinyartist-editor.css';

export interface CanvasLayoutProps {
    classNameId?: string;
    theme?: string;
    children: ReactNode;
    headerLeft?: ReactNode;
    headerCenter?: ReactNode;
    headerRight?: ReactNode;
    sidebarLeft?: ReactNode;
    footer?: ReactNode;
}

/**
 * CanvasLayout Template - Defines the overall layout structure
 /**
  * center - Auto-generated summary; refine if additional context is needed.
  *
  * @returns {for zoom controls} Refer to the implementation for the precise returned value.
  */
/**
 * center - Auto-generated documentation stub.
 */
/**
 * Header has three zones: left, center (for zoom controls), and right
 */
export const CanvasLayout = ({
    classNameId = "canvas-layout",
    theme = "kid",
    children,
    headerLeft,
    headerCenter,
    headerRight,
    sidebarLeft,
    footer,
}: CanvasLayoutProps) => {
    return (
        <div className={`${classNameId} ${theme}`}
        >
            {(headerLeft || headerCenter || headerRight) && (
                <div
                    key={`${classNameId}_header`}
                    className={`header`}
                >
                    {/* Left zone */}
                    <div
                        key={`${classNameId}_header_left`}
                        className={`left`}
                    >
                        {isValidElement(headerLeft)
                            ? React.cloneElement(headerLeft, { classNameId })
                            : headerLeft}
                    </div>

                    {/* Center zone - for zoom controls */}
                    <div
                        key={`${classNameId}_header_center`}
                        className={`center`}
                    >
                        {headerCenter}
                    </div>

                    {/* Right zone */}
                    <div
                        key={`${classNameId}_header_right`}
                        className={`right`}
                    >
                        {headerRight}
                    </div>
                </div>
            )}

            <div
                key={`${classNameId}_main`}
                className={`main`}
            >
                {sidebarLeft && (
                    <aside
                        key={`${classNameId}_sidebar_left`} 
                        className={`sidebar left`}  
                    >
                        {sidebarLeft}
                    </aside>
                )}

                <div
                    key={`${classNameId}_content`}
                    className={`content`}
                >
                    {children}
                </div>
            </div>

            {footer && (
                <div key={`${classNameId}_footer`}>
                    {isValidElement(footer)
                        ? React.cloneElement(footer, { classNameId })
                        : footer}
                </div>
            )}
        </div>
    );
};
