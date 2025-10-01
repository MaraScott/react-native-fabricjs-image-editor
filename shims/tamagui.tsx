import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type PropsWithChildren,
  type ComponentType,
  type FC,
  type MouseEvent,
  type ChangeEvent,
} from 'react';

type BaseProps = PropsWithChildren<{
  as?: keyof HTMLElementTagNameMap | ComponentType<any>;
  className?: string;
  style?: CSSProperties;
}> &
  Record<string, any>;

type StackStyleProps = CSSProperties & {
  gap?: number | string;
  paddingHorizontal?: number | string;
  paddingVertical?: number | string;
};

const stylePropNames = new Set<keyof StackStyleProps>([
  'gap',
  'padding',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingHorizontal',
  'paddingVertical',
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginInline',
  'marginBlock',
  'marginInlineStart',
  'marginInlineEnd',
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignItems',
  'justifyContent',
  'alignSelf',
  'justifySelf',
  'position',
  'top',
  'left',
  'right',
  'bottom',
  'zIndex',
  'background',
  'backgroundColor',
  'borderRadius',
  'borderWidth',
  'borderStyle',
  'borderColor',
  'border',
  'boxShadow',
  'overflow',
  'overflowX',
  'overflowY',
  'display',
  'flexWrap',
  'textAlign',
  'color',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'textTransform',
  'opacity',
  'inset',
  'rowGap',
  'columnGap',
  'gridTemplateColumns',
  'gridTemplateRows',
  'maxWidth',
  'maxHeight',
  'minBlockSize',
  'maxBlockSize',
]);

function resolveToken(value: unknown): unknown {
  if (typeof value === 'string' && value.startsWith('$')) {
    const numeric = Number(value.slice(1));
    if (!Number.isNaN(numeric)) {
      return `${numeric * 4}px`;
    }
  }
  return value;
}

function extractStyleProps<P extends BaseProps>(props: P) {
  const style: CSSProperties = { ...(props.style ?? {}) };
  const rest: Record<string, any> = {};

  Object.keys(props).forEach((key) => {
    if (key === 'style' || key === 'as' || key === 'children') {
      return;
    }

    const value = (props as Record<string, any>)[key];

    if (value === undefined) {
      return;
    }

    if (key === 'paddingHorizontal') {
      const resolved = resolveToken(value);
      style.paddingLeft = resolved as any;
      style.paddingRight = resolved as any;
      return;
    }

    if (key === 'paddingVertical') {
      const resolved = resolveToken(value);
      style.paddingTop = resolved as any;
      style.paddingBottom = resolved as any;
      return;
    }

    if (stylePropNames.has(key as keyof StackStyleProps)) {
      style[key as keyof CSSProperties] = resolveToken(value) as any;
      return;
    }

    rest[key] = value;
  });

  return { style, rest };
}

function createComponent<T extends BaseProps>(
  defaultElement: keyof HTMLElementTagNameMap,
  additionalStyle?: CSSProperties,
) {
  const Component = React.forwardRef<any, T>((props, ref) => {
    const { as: AsComponent, children, style: incomingStyle } = props;
    const { style, rest } = extractStyleProps(props);
    const ComponentToRender: any = AsComponent ?? defaultElement;
    const mergedStyle = { ...additionalStyle, ...style } as CSSProperties;
    if (incomingStyle) {
      Object.assign(mergedStyle, incomingStyle);
    }
    return (
      <ComponentToRender ref={ref} style={mergedStyle} {...rest}>
        {children}
      </ComponentToRender>
    );
  });
  Component.displayName = `Shim${defaultElement}`;
  return Component;
}

export const Stack = createComponent<BaseProps>('div');
export const XStack = createComponent<BaseProps>('div', { display: 'flex', flexDirection: 'row' });
export const YStack = createComponent<BaseProps>('div', { display: 'flex', flexDirection: 'column' });
export const ZStack = createComponent<BaseProps>('div', { position: 'relative' });

export const Text = createComponent<BaseProps>('span');
export const Paragraph = createComponent<BaseProps>('p');

type HeadingProps = BaseProps & { tag?: keyof Pick<HTMLElementTagNameMap, 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'> };
export const Heading = React.forwardRef<any, HeadingProps>((props, ref) => {
  const { tag = 'h2', ...rest } = props;
  const HeadingComponent = createComponent<HeadingProps>(tag);
  return <HeadingComponent ref={ref} {...rest} />;
});
Heading.displayName = 'ShimHeading';

export const Label = createComponent<BaseProps>('label');
export const Image = React.forwardRef<HTMLImageElement, BaseProps>((props, ref) => {
  const { style, rest } = extractStyleProps(props);
  return <img ref={ref} style={style} {...rest} />;
});
Image.displayName = 'ShimImage';

export const Input = React.forwardRef<HTMLInputElement, BaseProps>((props, ref) => {
  const { style, rest } = extractStyleProps(props);
  const { onChange, ...restProps } = rest;
  return <input ref={ref} style={style} onChange={onChange as any} {...restProps} />;
});
Input.displayName = 'ShimInput';

export const Separator = React.forwardRef<HTMLHRElement, BaseProps>((props, ref) => {
  const { style, rest } = extractStyleProps(props);
  return <hr ref={ref} style={style} {...rest} />;
});
Separator.displayName = 'ShimSeparator';

export const Button = React.forwardRef<HTMLButtonElement, BaseProps>((props, ref) => {
  const { style, rest } = extractStyleProps(props);
  const { onPress, onClick, type = 'button', ...restProps } = rest;
  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (typeof onPress === 'function') {
        onPress(event);
      }
      if (typeof onClick === 'function') {
        onClick(event);
      }
    },
    [onPress, onClick],
  );

  return <button ref={ref} type={type} style={style} onClick={handleClick} {...restProps} />;
});
Button.displayName = 'ShimButton';

export const Switch = React.forwardRef<HTMLInputElement, BaseProps>((props, ref) => {
  const { style, rest } = extractStyleProps(props);
  const { checked, defaultChecked, onCheckedChange, ...restProps } = rest;
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (typeof onCheckedChange === 'function') {
        onCheckedChange(event.target.checked);
      }
      if (typeof restProps.onChange === 'function') {
        restProps.onChange(event);
      }
    },
    [onCheckedChange, restProps],
  );
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', ...(style ?? {}) }}>
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={handleChange}
        {...restProps}
      />
      {props.children}
    </label>
  );
});
Switch.displayName = 'ShimSwitch';

export function useWindowDimensions() {
  const [dimensions, setDimensions] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  }));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handler = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return dimensions;
}

export const Theme: FC<BaseProps> = ({ children, ...rest }) => <Stack {...rest}>{children}</Stack>;

const TamaguiContext = createContext<{ config?: Record<string, unknown>; defaultTheme?: string } | null>(null);

export const TamaguiProvider: FC<{ config?: Record<string, unknown>; defaultTheme?: string }> = ({
  children,
  config,
  defaultTheme,
}) => {
  const value = useMemo(() => ({ config, defaultTheme }), [config, defaultTheme]);
  return <TamaguiContext.Provider value={value}>{children}</TamaguiContext.Provider>;
};

export function useTamaguiConfig() {
  return useContext(TamaguiContext);
}

type SliderProps = PropsWithChildren<{
  value?: number[];
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number[]) => void;
}> &
  BaseProps;

function SliderComponent(props: SliderProps, ref: React.Ref<HTMLDivElement>) {
  const { value, defaultValue, min = 0, max = 100, step = 1, onValueChange, children, ...rest } = props;
  const { style, rest: otherProps } = extractStyleProps(rest);
  const controlledValue = value?.[0];
  const [internalValue, setInternalValue] = useState<number>(controlledValue ?? defaultValue?.[0] ?? min);

  useEffect(() => {
    if (typeof controlledValue === 'number') {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = Number(event.target.value);
      if (Number.isNaN(nextValue)) {
        return;
      }
      if (controlledValue === undefined) {
        setInternalValue(nextValue);
      }
      onValueChange?.([nextValue]);
    },
    [controlledValue, onValueChange],
  );

  const inputValue = controlledValue ?? internalValue;

  return (
    <div ref={ref as any} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', ...style }} {...otherProps}>
      <input
        type="range"
        value={inputValue}
        defaultValue={defaultValue?.[0]}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
      />
      <div>{children}</div>
    </div>
  );
}

export const Slider = Object.assign(React.forwardRef<HTMLDivElement, SliderProps>(SliderComponent), {
  Track: createComponent<BaseProps>('div'),
  TrackActive: createComponent<BaseProps>('div'),
  Thumb: createComponent<BaseProps>('div'),
});
Slider.displayName = 'ShimSlider';

type PopoverContextValue = {
  open: boolean;
  setOpen: (value: boolean) => void;
  isControlled: boolean;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext(component: string): PopoverContextValue {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error(`${component} must be used within a Popover.`);
  }
  return context;
}

type PopoverRootProps = PropsWithChildren<{
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (value: boolean) => void;
}> &
  BaseProps;

function PopoverRoot(props: PopoverRootProps) {
  const { open, defaultOpen, onOpenChange, children, ...rest } = props;
  const { style, rest: other } = extractStyleProps(rest);
  const isControlled = typeof open === 'boolean';
  const [internalOpen, setInternalOpen] = useState<boolean>(defaultOpen ?? false);
  const currentOpen = isControlled ? Boolean(open) : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const contextValue = useMemo<PopoverContextValue>(
    () => ({ open: currentOpen, setOpen, isControlled }),
    [currentOpen, setOpen, isControlled],
  );

  return (
    <PopoverContext.Provider value={contextValue}>
      <div style={style} {...other}>
        {children}
      </div>
    </PopoverContext.Provider>
  );
}

const PopoverTrigger = React.forwardRef<HTMLDivElement, BaseProps>((props, ref) => {
  const { children, ...rest } = props;
  const { style, rest: other } = extractStyleProps(rest as BaseProps);
  const context = usePopoverContext('Popover.Trigger');

  const handleToggle = useCallback(
    (event: MouseEvent<Element>) => {
      if (!context.isControlled) {
        context.setOpen(!context.open);
      }
      if (React.isValidElement(children) && typeof children.props.onClick === 'function') {
        children.props.onClick(event);
      }
    },
    [context, children],
  );

  let content = children;
  if (React.isValidElement(children)) {
    content = React.cloneElement(children, {
      onClick: (event: MouseEvent<Element>) => {
        handleToggle(event);
      },
    });
  }

  return (
    <div ref={ref} style={style} {...other} onClick={!React.isValidElement(children) ? handleToggle : undefined}>
      {content}
    </div>
  );
});
PopoverTrigger.displayName = 'ShimPopoverTrigger';

const PopoverContent = React.forwardRef<HTMLDivElement, BaseProps>((props, ref) => {
  const { children, ...rest } = props;
  const { style, rest: other } = extractStyleProps(rest as BaseProps);
  const { open } = usePopoverContext('Popover.Content');

  if (!open) {
    return null;
  }

  return (
    <div ref={ref} style={{ position: 'absolute', zIndex: 100, ...style }} {...other}>
      {children}
    </div>
  );
});
PopoverContent.displayName = 'ShimPopoverContent';

const PopoverArrow = createComponent<BaseProps>('div', { width: '10px', height: '10px' });

export const Popover = Object.assign(PopoverRoot, {
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Arrow: PopoverArrow,
});

export const ParagraphText = Paragraph;
