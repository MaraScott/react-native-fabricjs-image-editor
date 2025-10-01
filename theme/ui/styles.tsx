import React, { type FC, type MouseEvent } from 'react';
import { Button, Stack, Text, YStack, type PropsWithChildren } from 'tamagui';

type SidebarContainerProps = PropsWithChildren<{
  left?: number | string;
  right?: number | string;
  width?: number | string;
  className?: string;
  style?: React.CSSProperties;
}>;

export function SidebarContainer({ children, left, right, width, style, className }: SidebarContainerProps) {
  return (
    <Stack
      className={className}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        width: width ?? 'auto',
        left,
        right,
        ...style,
      }}
    >
      {children}
    </Stack>
  );
}

type SidebarPanelProps = PropsWithChildren<{
  width?: number | string;
  padding?: number | string;
  className?: string;
  style?: React.CSSProperties;
}>;

export function SidebarPanel({ children, width, padding = '0', className, style }: SidebarPanelProps) {
  return (
    <YStack
      className={className}
      style={{
        width,
        padding,
        background: 'rgba(15, 23, 42, 0.92)',
        borderRight: '1px solid rgba(148, 163, 184, 0.16)',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </YStack>
  );
}

type SidebarScrollProps = PropsWithChildren<{ className?: string; style?: React.CSSProperties }>;

export function SidebarScroll({ children, className, style }: SidebarScrollProps) {
  return (
    <YStack
      className={className}
      style={{
        overflowY: 'auto',
        maxHeight: '100%',
        padding: '12px',
        gap: '12px',
        ...style,
      }}
    >
      {children}
    </YStack>
  );
}

type SidebarContentProps = PropsWithChildren<{ className?: string; style?: React.CSSProperties }>;

export function SidebarContent({ children, className, style }: SidebarContentProps) {
  return (
    <YStack className={className} style={{ gap: '12px', ...style }}>
      {children}
    </YStack>
  );
}

type SidebarToggleProps = PropsWithChildren<{
  onPress?: (event: MouseEvent<HTMLButtonElement>) => void;
  width?: number | string;
  backgroundColor?: string;
  className?: string;
  style?: React.CSSProperties;
}>;

export const SidebarToggle: FC<SidebarToggleProps> = ({
  children,
  onPress,
  width = 32,
  backgroundColor = 'rgba(15, 23, 42, 0.85)',
  className,
  style,
}) => {
  return (
    <Button
      className={className}
      width={typeof width === 'number' ? `${width}px` : width}
      height="100%"
      backgroundColor={backgroundColor}
      onPress={onPress}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(148, 163, 184, 0.24)',
        borderRadius: '12px',
        minHeight: '48px',
        ...style,
      }}
    >
      {children}
    </Button>
  );
};

type SidebarToggleLabelProps = PropsWithChildren<{ color?: string; className?: string; style?: React.CSSProperties }>;

export const SidebarToggleLabel: FC<SidebarToggleLabelProps> = ({ children, color = '#e2e8f0', className, style }) => {
  return (
    <Text className={className} style={{ color, fontWeight: 600, ...style }}>
      {children}
    </Text>
  );
};
