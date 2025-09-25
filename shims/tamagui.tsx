import {
  createElement,
  forwardRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type MouseEvent,
  type PropsWithChildren,
} from 'react';

type ElementTag = keyof JSX.IntrinsicElements;

type PrimitiveProps = HTMLAttributes<HTMLElement> & {
  tag?: ElementTag;
};

function mergeStyles(base: CSSProperties | undefined, style: CSSProperties | undefined): CSSProperties | undefined {
  if (base && style) {
    return { ...base, ...style };
  }
  if (base) {
    return { ...base };
  }
  return style ? { ...style } : undefined;
}

function createPrimitive(defaultTag: ElementTag, baseStyle?: CSSProperties) {
  return forwardRef<HTMLElement, PrimitiveProps>(({ tag, style, ...rest }, ref) => {
    const elementTag = tag ?? defaultTag;
    const mergedStyle = mergeStyles(baseStyle, style as CSSProperties | undefined);
    return createElement(elementTag, { ...rest, style: mergedStyle, ref });
  });
}

export interface TamaguiProviderProps extends PropsWithChildren<{ config?: unknown; defaultTheme?: string | null }>, PrimitiveProps {}

export const TamaguiProvider = ({ children, tag, ...rest }: TamaguiProviderProps) => {
  if (tag) {
    return createElement(tag, rest, children);
  }
  return <>{children}</>;
};

export interface ThemeProps extends PropsWithChildren<{ name?: string | null }>, PrimitiveProps {}

export const Theme = ({ children, tag, ...rest }: ThemeProps) => {
  if (tag) {
    return createElement(tag, rest, children);
  }
  return <>{children}</>;
};

export const Stack = createPrimitive('div');

export const XStack = createPrimitive('div', { display: 'flex', flexDirection: 'row' });

export const YStack = createPrimitive('div', { display: 'flex', flexDirection: 'column' });

export const Heading = createPrimitive('h2');

export const Paragraph = createPrimitive('p');

export const Text = createPrimitive('span');

export const Separator = createPrimitive('hr', { border: 'none', borderBottom: '1px solid currentColor', margin: 0 });

export interface ButtonProps extends PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> {
  onPress?: ((event: MouseEvent<HTMLButtonElement>) => void) | null;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ onPress, onClick, type = 'button', ...rest }, ref) => (
  <button ref={ref} type={type} onClick={onClick ?? onPress ?? undefined} {...rest} />
));

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => <input ref={ref} {...props} />);

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>((props, ref) => <label ref={ref} {...props} />);

export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {}

export const Image = forwardRef<HTMLImageElement, ImageProps>((props, ref) => <img ref={ref} {...props} />);

export default {
  TamaguiProvider,
  Theme,
  Stack,
  XStack,
  YStack,
  Heading,
  Paragraph,
  Text,
  Separator,
  Button,
  Input,
  Label,
  Image,
};
