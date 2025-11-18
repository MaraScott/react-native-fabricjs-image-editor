import type { ReactNode, ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    key?: string;
    children: ReactNode;
    action: string;
    id?: string;
    className?: string;
    title?: string;
}

export const ButtonLayer = ({
    key,
    children,
    action = 'default',
    id,
    className,
    title,
    ...props
}: ButtonProps) => {
    title = title || `${action} layer panel`;
    if (className === undefined) {
        if (id !== undefined) {
            className = `${id}-${action}`;
        } else {
            className = `${action}`;
        }
    }
    key = key ? `layer-panel-${key}-button` : `layer-panel-${className}-button`;
    return (
        <button
            key={key}
            id={id}
            className={className}
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            aria-label={title}
            title={title}
            {...props}
        >
            {children}
        </button>
    );
}