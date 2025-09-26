import {
  forwardRef,
  useEffect,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type PropsWithChildren,
} from 'react';

type DivProps = ComponentPropsWithoutRef<'div'>;

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  onPress?: (event: MouseEvent<HTMLButtonElement>) => void;
};

type InputProps = ComponentPropsWithoutRef<'input'>;

type ImageProps = ComponentPropsWithoutRef<'img'>;

type LabelProps = ComponentPropsWithoutRef<'label'>;

type ParagraphProps = ComponentPropsWithoutRef<'p'>;

type TextProps = ComponentPropsWithoutRef<'span'>;

type HeadingProps = ComponentPropsWithoutRef<'h2'> & {
  tag?: keyof JSX.IntrinsicElements;
};

type ThemeProps = PropsWithChildren<{ name?: string }> & DivProps;

type ProviderProps = PropsWithChildren<{ config?: unknown; defaultTheme?: string | null }>;

const mergeStyle = (style?: DivProps['style'], overrides?: DivProps['style']) => {
  if (!style && !overrides) {
    return undefined;
  }
  return { ...(style ?? {}), ...(overrides ?? {}) };
};

export const Stack = forwardRef<HTMLDivElement, DivProps>(({ style, ...rest }, ref) => {
  return <div ref={ref} style={style} {...rest} />;
});

Stack.displayName = 'Stack';

export const XStack = forwardRef<HTMLDivElement, DivProps>(({ style, ...rest }, ref) => {
  return <div ref={ref} style={mergeStyle(style, { display: 'flex', flexDirection: 'row' })} {...rest} />;
});

XStack.displayName = 'XStack';

export const YStack = forwardRef<HTMLDivElement, DivProps>(({ style, ...rest }, ref) => {
  return <div ref={ref} style={mergeStyle(style, { display: 'flex', flexDirection: 'column' })} {...rest} />;
});

YStack.displayName = 'YStack';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ onPress, onClick, type = 'button', ...rest }, ref) => {
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      if (typeof onClick === 'function') {
        onClick(event);
      }
      if (typeof onPress === 'function') {
        onPress(event);
      }
    };

    return <button ref={ref} type={type} onClick={handleClick} {...rest} />;
  },
);

Button.displayName = 'Button';

export const Heading = forwardRef<HTMLElement, HeadingProps>(
  ({ tag = 'h2', children, ...rest }, ref) => {
    const Component = tag as keyof JSX.IntrinsicElements;
    return (
      <Component ref={ref as any} {...rest}>
        {children}
      </Component>
    );
  },
);

Heading.displayName = 'Heading';

export const Image = forwardRef<HTMLImageElement, ImageProps>((props, ref) => {
  return <img ref={ref} {...props} />;
});

Image.displayName = 'Image';

export const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <input ref={ref} {...props} />;
});

Input.displayName = 'Input';

export const Label = forwardRef<HTMLLabelElement, LabelProps>((props, ref) => {
  return <label ref={ref} {...props} />;
});

Label.displayName = 'Label';

export const Paragraph = forwardRef<HTMLParagraphElement, ParagraphProps>((props, ref) => {
  return <p ref={ref} {...props} />;
});

Paragraph.displayName = 'Paragraph';

export const Separator = forwardRef<HTMLHRElement, ComponentPropsWithoutRef<'hr'>>((props, ref) => {
  return <hr ref={ref} {...props} />;
});

Separator.displayName = 'Separator';

export const Text = forwardRef<HTMLSpanElement, TextProps>((props, ref) => {
  return <span ref={ref} {...props} />;
});

Text.displayName = 'Text';

const defaultDimensions = { width: 1024, height: 768 };

export function useWindowDimensions() {
  const initial = useMemo(() => {
    if (typeof window === 'undefined') {
      return defaultDimensions;
    }
    return { width: window.innerWidth, height: window.innerHeight };
  }, []);

  const [dimensions, setDimensions] = useState(initial);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return dimensions;
}

export const Theme = forwardRef<HTMLDivElement, ThemeProps>(({ name, style, ...rest }, ref) => {
  return <div ref={ref} data-theme={name ?? undefined} style={style} {...rest} />;
});

Theme.displayName = 'Theme';

export function TamaguiProvider({ children }: ProviderProps) {
  return <>{children}</>;
}
