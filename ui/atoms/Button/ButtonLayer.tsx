import type { ReactNode, ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    action?: string;
    id?: string;
    className?: string;
    title?: string;
}

export const ButtonLayer = ({
    children,
    action = 'default',
    id,
    className,
    title,
    ...props
}: ButtonProps) => {
    const computedTitle = title ?? `${action} layer panel`;
    const computedClassName = className ?? (id ? `${id}-${action}` : action);

    return (
        <button
            id={id}
            className={computedClassName}
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            aria-label={computedTitle}
            title={computedTitle}
            {...props}
        >
            {children}
        </button>
    );
}
