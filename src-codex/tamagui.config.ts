import { createFont, createTamagui, createTokens, createTheme } from 'tamagui';

const tokens = createTokens({
  color: {
    white: '#ffffff',
    black: '#000000',
    slate100: '#f1f5f9',
    slate300: '#cbd5f5',
    slate500: '#64748b',
    slate900: '#0f172a',
    blue500: '#3b82f6',
    pink400: '#f472b6',
    purple500: '#8b5cf6',
    yellow300: '#fde047',
    orange400: '#fb923c',
    green500: '#22c55e',
  },
  radius: {
    sm: 6,
    md: 12,
    lg: 18,
    xl: 24,
  },
  space: {
    xs: 6,
    sm: 12,
    md: 18,
    lg: 24,
    xl: 32,
  },
  size: {
    xs: 12,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  },
});

const bodyFont = createFont({
  family: 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif',
  size: {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 20,
    6: 24,
  },
  weight: {
    4: '400',
    6: '600',
    7: '700',
  },
  lineHeight: {
    1: 18,
    2: 20,
    3: 24,
    4: 28,
    5: 30,
    6: 36,
  },
});

const kidTheme = createTheme({
  background: tokens.color.yellow300,
  color: tokens.color.slate900,
  accent: tokens.color.pink400,
  muted: '#ffffff80',
});

const adultTheme = createTheme({
  background: tokens.color.slate100,
  color: tokens.color.slate900,
  accent: tokens.color.blue500,
  muted: '#ffffff',
});

const midnightTheme = createTheme({
  background: '#111827',
  color: tokens.color.slate100,
  accent: tokens.color.purple500,
  muted: '#ffffff08',
});

export const appConfig = createTamagui({
  tokens,
  themes: {
    kid: kidTheme,
    adult: adultTheme,
    midnight: midnightTheme,
  },
  fonts: {
    body: bodyFont,
  },
  shorthands: {
    p: 'padding',
    px: 'paddingHorizontal',
    py: 'paddingVertical',
    m: 'margin',
    mx: 'marginHorizontal',
    my: 'marginVertical',
    w: 'width',
    h: 'height',
    br: 'borderRadius',
  },
});

export type AppConfig = typeof appConfig;

declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface TamaguiCustomConfig extends AppConfig {}
}
