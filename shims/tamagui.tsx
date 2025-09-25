import {
  createElement,
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

export interface PrimitiveProps extends HTMLAttributes<HTMLElement> {
  tag?: ElementTag;
}

function mergeStyles(base: CSSProperties | undefined, style: CSSProperties | undefined): CSSProperties | undefined {
  if (base && style) {
    return { ...base, ...style };
  }
  if (base) {
    return { ...base };
  }
  return style ? { ...style } : undefined;
}

function renderPrimitive(
  defaultTag: ElementTag,
  baseStyle: CSSProperties | undefined,
  { tag, style, ...rest }: PrimitiveProps,
) {
  const elementTag = tag ?? defaultTag;
  const mergedStyle = mergeStyles(baseStyle, style as CSSProperties | undefined);
  return createElement(elementTag, { ...rest, style: mergedStyle });
}

export interface TamaguiProviderProps
  extends PropsWithChildren<{ config?: unknown; defaultTheme?: string | null }>,
    PrimitiveProps {}

export function TamaguiProvider({ children, tag, ...rest }: TamaguiProviderProps) {
  if (tag) {
    return createElement(tag, rest, children);
  }
  return <>{children}</>;
}

export interface ThemeProps extends PropsWithChildren<{ name?: string | null }>, PrimitiveProps {}

export function Theme({ children, tag, ...rest }: ThemeProps) {
  if (tag) {
    return createElement(tag, rest, children);
  }
  return <>{children}</>;
}

export function Stack(props: PrimitiveProps) {
  return renderPrimitive('div', undefined, props);
}

export function XStack(props: PrimitiveProps) {
  return renderPrimitive('div', { display: 'flex', flexDirection: 'row' }, props);
}

export function YStack(props: PrimitiveProps) {
  return renderPrimitive('div', { display: 'flex', flexDirection: 'column' }, props);
}

export function Heading(props: PrimitiveProps) {
  return renderPrimitive('h2', undefined, props);
}

export function Paragraph(props: PrimitiveProps) {
  return renderPrimitive('p', undefined, props);
}

export function Text(props: PrimitiveProps) {
  return renderPrimitive('span', undefined, props);
}

export function Separator(props: PrimitiveProps) {
  return renderPrimitive('hr', { border: 'none', borderBottom: '1px solid currentColor', margin: 0 }, props);
}

export interface ButtonProps extends PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> {
  onPress?: ((event: MouseEvent<HTMLButtonElement>) => void) | null;
}

export function Button({ onPress, onClick, type = 'button', ...rest }: ButtonProps) {
  return createElement('button', { type, onClick: onClick ?? onPress ?? undefined, ...rest });
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input(props: InputProps) {
  return createElement('input', props);
}

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export function Label(props: LabelProps) {
  return createElement('label', props);
}

export interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {}

export function Image(props: ImageProps) {
  return createElement('img', props);
}

const TamaguiShim = {
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

export default TamaguiShim;
