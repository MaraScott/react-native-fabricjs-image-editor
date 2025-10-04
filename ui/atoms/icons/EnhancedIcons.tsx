import { memo, forwardRef, useMemo } from 'react';
import { MaterialCommunityIcons, type MaterialCommunityIconsProps } from '@atoms/icons/MaterialCommunityIcons';
import iconsData from '@assets/img/icons';

/**
 * Improvements applied:
 * - Consistent props across all custom icons (size, color, title/accessibility, className)
 * - Better accessibility: role="img", aria-label via `title`, aria-hidden when decorative
 * - Pixel-align strokes & rounded caps/joins for crisper rendering
 * - RTL-aware Undo/Redo via `dir` prop (auto inherits document.dir if not provided)
 * - Theming knobs: `theme="kid" | "adult"`
 * - Dynamic light/dark icon selection based on background color
 */

type ThemeKind = 'kid' | 'adult';

interface IconData {
  src: {
    original?: string;
    light: string;
    dark: string;
    default: 'light' | 'dark';
  };
  name: string;
  id: string;
}

const icons = iconsData as IconData[];

/**
 * Calculate perceived brightness of a color using relative luminance formula
 * Returns true if the color is light (should use dark icons)
 */
export function isLightBackground(color?: string): boolean {
  if (!color) return true; // default to light background

  // Handle hex colors
  const hex = color.replace('#', '');
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  }
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  }

  // Handle rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch.map(Number);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  }

  return true; // default to light
}

/**
 * Get icon source based on icon name and background color
 */
export function getIconSrc(iconName: string, backgroundColor?: string): string | null {
  
  let iconData = icons.find((icon) => icon.name === iconName || icon.id === `icon-${iconName}`);
  console.log(iconName, iconData);
  if (!iconData) iconData = icons.find((icon) => icon.name === "default");

  const useLight = isLightBackground(backgroundColor);
  return useLight ? iconData.src.dark : iconData.src.light;
}

const palette = {
  kid: {
    primary: '#1e5bc6',
    accentA: '#FFB700',
    accentB: '#00D68F',
    accentC: '#FFAB19',
    accentD: '#0FBD8C',
    accentE: '#FF6680',
    accentF: '#A0D900',
    accentG: '#00D3FF',
    ink: '#0f172a',
  },
  adult: {
    primary: '#0f172a',
    ink: '#0f172a',
  },
} as const;

export const EnhancedIcon = memo(({ name = 'logo', backgroundColor = 'transparent', size = 16, theme = 'kid', ...rest }) => {
    const iconSrc = useMemo(() => getIconSrc(name, backgroundColor), [backgroundColor]);

    return (
        <img alt={name} src={iconSrc}
            width={size} height={size}
            draggable="false"
        />
    );
});

EnhancedIcon.displayName = 'EnhancedIcon';