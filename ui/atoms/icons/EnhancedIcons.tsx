import { memo, forwardRef } from 'react';
import { MaterialCommunityIcons, type MaterialCommunityIconsProps } from '@atoms/icons/MaterialCommunityIcons';

/**
 * Improvements applied:
 * - Consistent props across all custom icons (size, color, title/accessibility, className)
 * - Better accessibility: role="img", aria-label via `title`, aria-hidden when decorative
 * - Pixel-align strokes & rounded caps/joins for crisper rendering
 * - Reduced inline styles; single wrapper for sparkles (no layout shift)
 * - Reusable <BaseSvg/> + <Sparkles/> utilities
 * - RTL-aware Undo/Redo via `dir` prop (auto inherits document.dir if not provided)
 * - Theming knobs: `theme="kid" | "adult"`, `decor="none" | "sparkles" | "badge"`
 */

type ThemeKind = 'kid' | 'adult';
type DecorKind = 'none' | 'sparkles' | 'badge';

export interface EnhancedIconProps extends Omit<MaterialCommunityIconsProps, 'name' | 'color' | 'size'> {
  readonly name: MaterialCommunityIconsProps['name'];
  readonly size?: number;
  readonly color?: string;
  readonly theme?: ThemeKind;
  readonly decor?: DecorKind;
  readonly title?: string; // for screen readers
  readonly dir?: 'ltr' | 'rtl' | 'auto';
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

const getDir = (dir?: 'ltr' | 'rtl' | 'auto'): 'ltr' | 'rtl' => {
  if (dir === 'ltr' || dir === 'rtl') return dir;
  if (typeof document !== 'undefined') {
    const d = (document.documentElement?.getAttribute('dir') || '').toLowerCase();
    return d === 'rtl' ? 'rtl' : 'ltr';
  }
  return 'ltr';
};

const a11y = (title?: string) =>
  title
    ? { role: 'img' as const, 'aria-label': title }
    : { 'aria-hidden': true as const, role: 'img' as const };

type BaseSvgProps = React.SVGAttributes<SVGSVGElement> & {
  size?: number;
  title?: string;
};

const BaseSvg = forwardRef<SVGSVGElement, BaseSvgProps>(function BaseSvg(
  { size = 24, title, children, ...rest },
  ref
) {
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      focusable="false"
      {...a11y(title)}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
});

const Sparkles = memo(function Sparkles() {
  // kept tiny & reusable; positioned via parent relative container
  return (
    <>
      <svg
        width="8"
        height="8"
        viewBox="0 0 8 8"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', top: -3, right: -3, pointerEvents: 'none' }}
      >
        <path
          d="M4 0 4.5 3.5 8 4 4.5 4.5 4 8 3.5 4.5 0 4 3.5 3.5 4 0Z"
          fill={palette.kid.accentA}
          opacity="0.9"
        />
      </svg>
      <svg
        width="6"
        height="6"
        viewBox="0 0 6 6"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', bottom: -2, left: -2, pointerEvents: 'none' }}
      >
        <path
          d="M3 0 3.3 2.7 6 3 3.3 3.3 3 6 2.7 3.3 0 3 2.7 2.7 3 0Z"
          fill={palette.kid.accentB}
          opacity="0.8"
        />
      </svg>
    </>
  );
});

export const EnhancedIcon = memo<EnhancedIconProps>(
  ({ theme = 'kid', decor = 'none', name, size = 20, color, title, dir = 'auto', style, ...rest }) => {
    const isKid = theme === 'kid';
    const ink = color || (isKid ? palette.kid.ink : palette.adult.ink);

    if (decor === 'none') {
      return <MaterialCommunityIcons name={name} size={size} color={ink} aria-hidden={!title} title={title} {...rest} />;
    }

    // Badge decor example (simple corner dot)
    if (decor === 'badge') {
      return (
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 0, verticalAlign: 'middle', ...style }}>
          <MaterialCommunityIcons name={name} size={size} color={ink} aria-hidden={!title} title={title} {...rest} />
          <span
            aria-hidden
            style={{
              position: 'absolute',
              right: -2,
              top: -2,
              width: Math.max(4, Math.round(size * 0.2)),
              height: Math.max(4, Math.round(size * 0.2)),
              borderRadius: 999,
              background: isKid ? palette.kid.accentC : ink,
              boxShadow: '0 0 0 1px #fff',
            }}
          />
        </span>
      );
    }

    // Sparkles
    return (
      <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 0, verticalAlign: 'middle', ...style }}>
        <MaterialCommunityIcons name={name} size={size} color={ink} aria-hidden={!title} title={title} {...rest} />
        <Sparkles />
      </span>
    );
  }
);

EnhancedIcon.displayName = 'EnhancedIcon';

/* =========================
   KID-FRIENDLY ICONS
   ========================= */

type BareIconProps = Omit<MaterialCommunityIconsProps, 'name'> & {
  title?: string;
};

export const KidFriendlyDrawIcon = memo<BareIconProps>(({ size = 24, color, title, ...rest }) => {
  const ink = color || palette.kid.primary;
  return (
    <BaseSvg size={size} title={title} stroke={ink} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {/* Crayon-style pencil */}
      <path d="M4 15.75 4.75 12.75 13.75 3.75 17.25 7.25 8.25 16.25 5.25 17Z" fill={ink} fillOpacity={0.3} />
      <path d="M4 15.75 3.25 19.5 7 18.75" />
      <path d="M12.75 3.75 16.25 7.25" />
      <circle cx="14.5" cy="5.5" r="0.85" fill={ink} />
      <circle cx="13.5" cy="6.5" r="0.7" fill={palette.kid.accentA} opacity="0.9" />
    </BaseSvg>
  );
});
KidFriendlyDrawIcon.displayName = 'KidFriendlyDrawIcon';

export const KidFriendlyShapeIcon = memo<BareIconProps>(({ size = 24, color, title, ...rest }) => {
  const ink = color || palette.kid.primary;
  return (
    <BaseSvg size={size} title={title} stroke={ink} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <rect x={5} y={7} width={6} height={6} rx={1.75} fill={ink} fillOpacity={0.22} />
      <circle cx={16} cy={10} r={3} />
      <polygon points="12 15 9 19 15 19 12 15" fill={ink} fillOpacity={0.18} />
      <circle cx="18.5" cy="6.5" r="0.9" fill={palette.kid.accentC} />
    </BaseSvg>
  );
});
KidFriendlyShapeIcon.displayName = 'KidFriendlyShapeIcon';

export const KidFriendlyEraserIcon = memo<BareIconProps>(({ size = 24, color, title, ...rest }) => {
  const ink = color || '#c91d55';
  return (
    <BaseSvg size={size} title={title} stroke={ink} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path
        d="M5 15 12.25 7.75a1.5 1.5 0 0 1 2.12 0L19 12.38l-6.25 6.25H8.12a1.5 1.5 0 0 1-1.06-.44L5 17.12a1.5 1.5 0 0 1 0-2.12Z"
        fill={ink}
        fillOpacity={0.25}
      />
      <path d="M5 15 9.5 19.5" />
      <path d="M12.25 7.75 19 14.5" />
      <circle cx="8" cy="13" r="0.9" fill={palette.kid.accentA} />
      <circle cx="15" cy="10" r="0.8" fill={palette.kid.accentB} />
    </BaseSvg>
  );
});
KidFriendlyEraserIcon.displayName = 'KidFriendlyEraserIcon';

export const KidFriendlyTextIcon = memo<BareIconProps>(({ size = 24, color, title, ...rest }) => {
  const ink = color || '#9966FF';
  return (
    <BaseSvg size={size} title={title} stroke={ink} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path d="M4 7h16M4 12h12M4 17h8" />
      <circle cx="19" cy="17" r="1.2" fill={palette.kid.accentC} />
    </BaseSvg>
  );
});
KidFriendlyTextIcon.displayName = 'KidFriendlyTextIcon';

export const KidFriendlyImageIcon = memo<BareIconProps>(({ size = 24, color, title, ...rest }) => {
  const ink = color || palette.kid.accentD;
  return (
    <BaseSvg size={size} title={title} stroke={ink} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <rect x={3} y={3} width={18} height={18} rx={3} fill={ink} fillOpacity={0.16} />
      <circle cx={8.5} cy={8.5} r={2} fill={ink} fillOpacity={0.45} />
      <path d="M21 15 16 10 5 21" strokeWidth={2.8} />
      <circle cx="18" cy="6" r="1.05" fill={palette.kid.accentA} />
    </BaseSvg>
  );
});
KidFriendlyImageIcon.displayName = 'KidFriendlyImageIcon';

export const KidFriendlyCircleIcon = memo<BareIconProps>(({ size = 24, color, title, ...rest }) => {
  const ink = color || '#FF6680';
  return (
    <BaseSvg size={size} title={title} stroke={ink} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <circle cx={12} cy={12} r={8} fill={ink} fillOpacity={0.22} />
      <circle cx="17" cy="8" r="1" fill={palette.kid.accentC} />
    </BaseSvg>
  );
});
KidFriendlyCircleIcon.displayName = 'KidFriendlyCircleIcon';

export const KidFriendlyRectIcon = memo<BareIconProps>(({ size = 24, color, title, ...rest }) => {
  const ink = color || '#FF8C1A';
  return (
    <BaseSvg size={size} title={title} stroke={ink} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <rect x={4} y={6} width={16} height={12} rx={2} fill={ink} fillOpacity={0.22} />
      <circle cx="18" cy="8" r="1" fill={palette.kid.accentG} />
    </BaseSvg>
  );
});
KidFriendlyRectIcon.displayName = 'KidFriendlyRectIcon';

export const KidFriendlyTriangleIcon = memo<BareIconProps>(({ size = 24, color, title, ...rest }) => {
  const ink = color || '#A0D900';
  return (
    <BaseSvg size={size} title={title} stroke={ink} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path d="M12 4 4 20H20L12 4Z" fill={ink} fillOpacity={0.22} />
      <circle cx="16" cy="10" r="1" fill="#CF63CF" />
    </BaseSvg>
  );
});
KidFriendlyTriangleIcon.displayName = 'KidFriendlyTriangleIcon';

export const KidFriendlyUndoIcon = memo<BareIconProps & { dir?: 'ltr' | 'rtl' | 'auto' }>(
  ({ size = 24, ...rest }) => {
    return (
      <img 
        alt="Undo" 
        width={size} 
        height={size} 
        draggable="false" 
        src={`data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+Cjxzdmcgd2lkdGg9IjIwcHgiIGhlaWdodD0iMjBweCIgdmlld0JveD0iMCAwIDIwIDIwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgPCEtLSBHZW5lcmF0b3I6IFNrZXRjaCA0My4yICgzOTA2OSkgLSBodHRwOi8vd3d3LmJvaGVtaWFuY29kaW5nLmNvbS9za2V0Y2ggLS0+CiAgICA8dGl0bGU+dW5kbzwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPjwvZGVmcz4KICAgIDxnIGlkPSJQYWdlLTEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxnIGlkPSJ1bmRvIiBmaWxsPSIjODU1Q0Q2Ij4KICAgICAgICAgICAgPHBhdGggZD0iTTE1LjU1ODE2MzUsMTIuNzcwMDY1MSBMMTEuODQwMzk3MiwxNi40OTQxMzE1IEMxMS41NjEwOTIyLDE2Ljc2NzEzNjQgMTEuMTgzMDg1NCwxNi45MjExMzkxIDEwLjc5MDM3ODQsMTYuOTIxMTM5MSBDMTAuMzk5MDcxNSwxNi45MjExMzkxIDEwLjAyMTA2NDcsMTYuNzY3MTM2NCA5Ljc0MDM1OTcxLDE2LjQ5NDEzMTUgTDYuMDIzOTkzNDIsMTIuNzcwMDY1MSBDNS41OTY5ODU4LDEyLjM0MzA1NzQgNS40NzA5ODM1NSwxMS43MDYwNDYxIDUuNzAxOTg3NjcsMTEuMTUzMDM2MiBDNS45MzI5OTE3OSwxMC42MDAwMjYzIDYuNDY1MDAxMjgsMTAuMjQzMDIgNy4wNjcwMTIwMiwxMC4yNDMwMiBMOC40MDQwMzU4NywxMC4yNDMwMiBDOC4zNjkwMzUyNSw5LjkyMTAxNDIzIDguMjc4MDMzNjIsOS41NTcwMDc3NCA4LjEyNDAzMDg4LDkuMTcyMDAwODcgQzguMDc1NzMwMDIsOS4wNTk5OTg4NyA4LjAyNjAyOTEzLDguOTQ3OTk2ODggNy45NzAwMjgxMyw4LjgzNTk5NDg4IEM3Ljg5MzAyNjc2LDguNzA5OTkyNjMgNy45MDA3MjY4OSw4LjY3NDk5MjAxIDcuNzk1MDI1MDEsOC41MjA5ODkyNiBDNy42MjcwMjIwMSw4LjI2ODk4NDc2IDcuNDczMDE5MjYsOC4wNzk5ODEzOSA3LjI5MDMxNjAxLDcuODYyOTc3NTIgQzYuOTIwMDA5NCw3LjQ2Mzk3MDQgNi40NzIwMDE0MSw3LjEyMDk2NDI5IDUuOTk1OTkyOTIsNi44Njg5NTk3OSBDNS41MTI5ODQzLDYuNjE2OTU1MyA1LjAwODk3NTMxLDYuNDYyOTUyNTUgNC41NjA5NjczMiw2LjM3ODk1MTA1IEM0LjExOTk1OTQ1LDYuMzAxOTQ5NjggMy43MTM5NTIyMSw2LjI5NDk0OTU1IDMuNDc1OTQ3OTYsNi4yOTQ5NDk1NSBDMy4zNTY5NDU4NCw2LjI4Nzk0OTQzIDMuMjAyOTQzMSw2LjMxNTk0OTkzIDMuMTI1OTQxNzIsNi4zMjI5NTAwNSBDMy4wNDE5NDAyMiw2LjMyOTk1MDE4IDIuOTkyOTM5MzUsNi4zMzY5NTAzIDIuOTkyOTM5MzUsNi4zMzY5NTAzIEMyLjQ5NTkzMDQ4LDYuMzg1OTUxMTcgMi4wNDc5MjI0OSw2LjAyMTk0NDY4IDEuOTk4OTIxNjIsNS41MjQ5MzU4MiBDMS45NTY5MjA4Nyw1LjEwNDkyODMyIDIuMjAxOTI1MjQsNC43MjY5MjE1OCAyLjU3MjkzMTg2LDQuNTg2OTE5MDggQzIuNTcyOTMxODYsNC41ODY5MTkwOCAyLjYyMTkzMjczLDQuNTY1OTE4NzEgMi42OTg5MzQxLDQuNTM3OTE4MjEgQzIuNzg5OTM1NzMsNC41MDk5MTc3MSAyLjg3MzkzNzIzLDQuNDYwOTE2ODQgMy4wNjk5NDA3Miw0LjQwNDkxNTg0IEMzLjQ2MTk0NzcyLDQuMjg1OTEzNzEgMy45NTg5NTY1OCw0LjE1OTkxMTQ3IDQuNjA5OTY4MTksNC4wOTY5MTAzNCBDNS4yNTM5Nzk2OCw0LjA0MDkwOTM0IDYuMDMwOTkzNTQsNC4wNTQ5MDk1OSA2Ljg1MDcwODE2LDQuMjIyOTEyNTkgQzcuNjY5MDIyNzYsNC4zOTc5MTU3MSA4LjUzMDAzODEyLDQuNzI2OTIxNTggOS4zMjgwNTIzNSw1LjIwMjkzMDA3IEM5LjcwNjA1OTEsNS40NDc5MzQ0NCAxMC4xMTIwNjYzLDUuNzM0OTM5NTYgMTAuNDI3MDcyLDYuMDE0OTQ0NTYgQzEwLjU2NzA3NDUsNi4xMTk5NDY0MyAxMC44MDUwNzg3LDYuMzU3OTUwNjggMTAuOTQ1MDgxMiw2LjUwNDk1MzMgQzExLjEwNjA4NDEsNi42NzI5NTYyOSAxMS4yNTMwODY3LDYuODQwOTU5MjkgMTEuNDAwNzg5Myw3LjAxNTk2MjQxIEMxMS45NjcwOTk0LDcuNzE1OTc0OSAxMi4zODcxMDY5LDguNDcxOTg4MzkgMTIuNjYwMTExOCw5LjE1ODAwMDYyIEMxMi44MjExMTQ3LDkuNTUwMDA3NjIgMTIuOTMzMTE2Nyw5LjkyMTAxNDIzIDEzLjAxNzExODIsMTAuMjQzMDIgTDE0LjUxNTE0NDksMTAuMjQzMDIgQzE1LjExNzE1NTYsMTAuMjQzMDIgMTUuNjQ5MTY1MSwxMC42MDAwMjYzIDE1Ljg4MDE2OTIsMTEuMTUzMDM2MiBDMTYuMTExMTczNCwxMS43MDYwNDYxIDE1Ljk4NTE3MTEsMTIuMzQzMDU3NCAxNS41NTgxNjM1LDEyLjc3MDA2NTEiIGlkPSJGaWxsLTEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDguOTk0MjQ3LCAxMC40OTQyNDcpIHNjYWxlKC0xLCAxKSByb3RhdGUoLTQ1LjAwMDAwMCkgdHJhbnNsYXRlKC04Ljk5NDI0NywgLTEwLjQ5NDI0NykgIj48L3BhdGg+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4K`}
      />
    );
  }
);
KidFriendlyUndoIcon.displayName = 'KidFriendlyUndoIcon';

export const KidFriendlyRedoIcon = memo<BareIconProps & { dir?: 'ltr' | 'rtl' | 'auto' }>(
  ({ size = 24, ...rest }) => {
    return (
      <img 
        alt="Redo" 
        width={size} 
        height={size} 
        draggable="false" 
        src={`data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+Cjxzdmcgd2lkdGg9IjIwcHgiIGhlaWdodD0iMjBweCIgdmlld0JveD0iMCAwIDIwIDIwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgPCEtLSBHZW5lcmF0b3I6IFNrZXRjaCA0My4yICgzOTA2OSkgLSBodHRwOi8vd3d3LmJvaGVtaWFuY29kaW5nLmNvbS9za2V0Y2ggLS0+CiAgICA8dGl0bGU+cmVkbzwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPjwvZGVmcz4KICAgIDxnIGlkPSJQYWdlLTEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxnIGlkPSJyZWRvIiBmaWxsPSIjODU1Q0Q2Ij4KICAgICAgICAgICAgPHBhdGggZD0iTTE3LjU1ODE2MzUsMTIuNzcwMDY1MSBMMTMuODQwMzk3MiwxNi40OTQxMzE1IEMxMy41NjEwOTIyLDE2Ljc2NzEzNjQgMTMuMTgzMDg1NCwxNi45MjExMzkxIDEyLjc5MDM3ODQsMTYuOTIxMTM5MSBDMTIuMzk5MDcxNSwxNi45MjExMzkxIDEyLjAyMTA2NDcsMTYuNzY3MTM2NCAxMS43NDAzNTk3LDE2LjQ5NDEzMTUgTDguMDIzOTkzNDIsMTIuNzcwMDY1MSBDNy41OTY5ODU4LDEyLjM0MzA1NzQgNy40NzA5ODM1NSwxMS43MDYwNDYxIDcuNzAxOTg3NjcsMTEuMTUzMDM2MiBDNy45MzI5OTE3OSwxMC42MDAwMjYzIDguNDY1MDAxMjgsMTAuMjQzMDIgOS4wNjcwMTIwMiwxMC4yNDMwMiBMMTAuNDA0MDM1OSwxMC4yNDMwMiBDMTAuMzY5MDM1Miw5LjkyMTAxNDIzIDEwLjI3ODAzMzYsOS41NTcwMDc3NCAxMC4xMjQwMzA5LDkuMTcyMDAwODcgQzEwLjA3NTczLDkuMDU5OTk4ODcgMTAuMDI2MDI5MSw4Ljk0Nzk5Njg4IDkuOTcwMDI4MTMsOC44MzU5OTQ4OCBDOS44OTMwMjY3Niw4LjcwOTk5MjYzIDkuOTAwNzI2ODksOC42NzQ5OTIwMSA5Ljc5NTAyNTAxLDguNTIwOTg5MjYgQzkuNjI3MDIyMDEsOC4yNjg5ODQ3NiA5LjQ3MzAxOTI2LDguMDc5OTgxMzkgOS4yOTAzMTYwMSw3Ljg2Mjk3NzUyIEM4LjkyMDAwOTQsNy40NjM5NzA0IDguNDcyMDAxNDEsNy4xMjA5NjQyOSA3Ljk5NTk5MjkyLDYuODY4OTU5NzkgQzcuNTEyOTg0Myw2LjYxNjk1NTMgNy4wMDg5NzUzMSw2LjQ2Mjk1MjU1IDYuNTYwOTY3MzIsNi4zNzg5NTEwNSBDNi4xMTk5NTk0NSw2LjMwMTk0OTY4IDUuNzEzOTUyMjEsNi4yOTQ5NDk1NSA1LjQ3NTk0Nzk2LDYuMjk0OTQ5NTUgQzUuMzU2OTQ1ODQsNi4yODc5NDk0MyA1LjIwMjk0MzEsNi4zMTU5NDk5MyA1LjEyNTk0MTcyLDYuMzIyOTUwMDUgQzUuMDQxOTQwMjIsNi4zMjk5NTAxOCA0Ljk5MjkzOTM1LDYuMzM2OTUwMyA0Ljk5MjkzOTM1LDYuMzM2OTUwMyBDNC40OTU5MzA0OCw2LjM4NTk1MTE3IDQuMDQ3OTIyNDksNi4wMjE5NDQ2OCAzLjk5ODkyMTYyLDUuNTI0OTM1ODIgQzMuOTU2OTIwODcsNS4xMDQ5MjgzMiA0LjIwMTkyNTI0LDQuNzI2OTIxNTggNC41NzI5MzE4Niw0LjU4NjkxOTA4IEM0LjU3MjkzMTg2LDQuNTg2OTE5MDggNC42MjE5MzI3Myw0LjU2NTkxODcxIDQuNjk4OTM0MSw0LjUzNzkxODIxIEM0Ljc4OTkzNTczLDQuNTA5OTE3NzEgNC44NzM5MzcyMyw0LjQ2MDkxNjg0IDUuMDY5OTQwNzIsNC40MDQ5MTU4NCBDNS40NjE5NDc3Miw0LjI4NTkxMzcxIDUuOTU4OTU2NTgsNC4xNTk5MTE0NyA2LjYwOTk2ODE5LDQuMDk2OTEwMzQgQzcuMjUzOTc5NjgsNC4wNDA5MDkzNCA4LjAzMDk5MzU0LDQuMDU0OTA5NTkgOC44NTA3MDgxNiw0LjIyMjkxMjU5IEM5LjY2OTAyMjc2LDQuMzk3OTE1NzEgMTAuNTMwMDM4MSw0LjcyNjkyMTU4IDExLjMyODA1MjQsNS4yMDI5MzAwNyBDMTEuNzA2MDU5MSw1LjQ0NzkzNDQ0IDEyLjExMjA2NjMsNS43MzQ5Mzk1NiAxMi40MjcwNzIsNi4wMTQ5NDQ1NiBDMTIuNTY3MDc0NSw2LjExOTk0NjQzIDEyLjgwNTA3ODcsNi4zNTc5NTA2OCAxMi45NDUwODEyLDYuNTA0OTUzMyBDMTMuMTA2MDg0MSw2LjY3Mjk1NjI5IDEzLjI1MzA4NjcsNi44NDA5NTkyOSAxMy40MDA3ODkzLDcuMDE1OTYyNDEgQzEzLjk2NzA5OTQsNy43MTU5NzQ5IDE0LjM4NzEwNjksOC40NzE5ODgzOSAxNC42NjAxMTE4LDkuMTU4MDAwNjIgQzE0LjgyMTExNDcsOS41NTAwMDc2MiAxNC45MzMxMTY3LDkuOTIxMDE0MjMgMTUuMDE3MTE4MiwxMC4yNDMwMiBMMTYuNTE1MTQ0OSwxMC4yNDMwMiBDMTcuMTE3MTU1NiwxMC4yNDMwMiAxNy42NDkxNjUxLDEwLjYwMDAyNjMgMTcuODgwMTY5MiwxMS4xNTMwMzYyIEMxOC4xMTExNzM0LDExLjcwNjA0NjEgMTcuOTg1MTcxMSwxMi4zNDMwNTc0IDE3LjU1ODE2MzUsMTIuNzcwMDY1MSIgaWQ9IkZpbGwtMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTAuOTk0MjQ3LCAxMC40OTQyNDcpIHJvdGF0ZSgtNDUuMDAwMDAwKSB0cmFuc2xhdGUoLTEwLjk5NDI0NywgLTEwLjQ5NDI0NykgIj48L3BhdGg+CiAgICAgICAgPC9nPgogICAgPC9nPgo8L3N2Zz4K`}
      />
    );
  }
);
KidFriendlyRedoIcon.displayName = 'KidFriendlyRedoIcon';

export const KidFriendlyTrashIcon = memo<BareIconProps>(({ size = 24, color, title, ...rest }) => {
  const ink = color || palette.kid.accentE;
  return (
    <BaseSvg size={size} title={title} stroke={ink} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" fill={ink} fillOpacity={0.16} />
      <line x1={10} y1={11} x2={10} y2={17} />
      <line x1={14} y1={11} x2={14} y2={17} />
    </BaseSvg>
  );
});
KidFriendlyTrashIcon.displayName = 'KidFriendlyTrashIcon';

export const KidFriendlyCopyIcon = memo<BareIconProps>(({ size = 24, color, title, ...rest }) => {
  const ink = color || '#9966FF';
  return (
    <BaseSvg size={size} title={title} stroke={ink} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <rect x={9} y={9} width={13} height={13} rx={2} ry={2} fill={ink} fillOpacity={0.16} />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      <circle cx="18" cy="11" r="1.05" fill={palette.kid.accentC} />
    </BaseSvg>
  );
});
KidFriendlyCopyIcon.displayName = 'KidFriendlyCopyIcon';

export const KidFriendlySaveIcon = memo<BareIconProps>(({ size = 24, color, title, ...rest }) => {
  const ink = color || palette.kid.accentD;
  return (
    <BaseSvg size={size} title={title} stroke={ink} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" fill={ink} fillOpacity={0.16} />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
      <circle cx="17" cy="6" r="1.05" fill={palette.kid.accentA} />
    </BaseSvg>
  );
});
KidFriendlySaveIcon.displayName = 'KidFriendlySaveIcon';

/* =========================
   ADULT / PROFESSIONAL ICONS
   ========================= */

export const ProfessionalDrawIcon = memo<BareIconProps>(({ size = 20, color, title, ...rest }) => {
  const ink = color || palette.adult.ink;
  return (
    <BaseSvg size={size} title={title} stroke={ink} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path d="M4 15.75 4.75 12.75 13.75 3.75 17.25 7.25 8.25 16.25 5.25 17Z" fill={ink} fillOpacity={0.08} />
      <path d="M4 15.75 3.25 19.5 7 18.75" />
      <path d="M12.75 3.75 16.25 7.25" />
      <path d="M6.5 17 9 19.5" />
    </BaseSvg>
  );
});
ProfessionalDrawIcon.displayName = 'ProfessionalDrawIcon';

export const ProfessionalShapeIcon = memo<BareIconProps>(({ size = 20, color, title, ...rest }) => {
  const ink = color || palette.adult.ink;
  return (
    <BaseSvg size={size} title={title} stroke={ink} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <rect x={4.5} y={6.5} width={15} height={11} rx={2} />
    </BaseSvg>
  );
});
ProfessionalShapeIcon.displayName = 'ProfessionalShapeIcon';

export const ProfessionalEraserIcon = memo<BareIconProps>(({ size = 20, color, title, ...rest }) => {
  const ink = color || palette.adult.ink;
  return (
    <BaseSvg size={size} title={title} stroke={ink} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path
        d="M5 15 12.25 7.75a1.5 1.5 0 0 1 2.12 0L19 12.38l-6.25 6.25H8.12a1.5 1.5 0 0 1-1.06-.44L5 17.12a1.5 1.5 0 0 1 0-2.12Z"
        fill={ink}
        fillOpacity={0.07}
      />
      <path d="M5 15 9.5 19.5" />
      <path d="M12.25 7.75 19 14.5" />
    </BaseSvg>
  );
});
ProfessionalEraserIcon.displayName = 'ProfessionalEraserIcon';

/* =========================
   KIDDO EDITOR STYLE ICONS
   (Based on the colorful, playful design)
   ========================= */

export const KidFriendlySelectIcon = memo<BareIconProps>(({ size = 24, ...rest }) => {
  return (
    <img 
        alt="Select" 
        width={size} 
        height={size} 
        draggable="false" 
        src={`data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+Cjxzdmcgd2lkdGg9IjIwcHgiIGhlaWdodD0iMjBweCIgdmlld0JveD0iMCAwIDIwIDIwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgPCEtLSBHZW5lcmF0b3I6IFNrZXRjaCA0My4yICgzOTA2OSkgLSBodHRwOi8vd3d3LmJvaGVtaWFuY29kaW5nLmNvbS9za2V0Y2ggLS0+CiAgICA8dGl0bGU+c2VsZWN0PC90aXRsZT4KICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogICAgPGRlZnM+PC9kZWZzPgogICAgPGcgaWQ9IlBhZ2UtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGcgaWQ9InNlbGVjdCIgZmlsbD0iIzU3NUU3NSI+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik05LjA4NDgwNzA5LDEyLjc1MTkxMzEgTDEwLjI2OTI5MzcsMTUuMzkxMDc1MyBDMTAuNTAyNTI4MSwxNS45MTI4NDggMTEuMTEwNTA5OCwxNi4xNDMyNzU1IDExLjYyNjc3MDEsMTUuOTA3NTUwOCBDMTIuMTQzMDMwNCwxNS42NzA1MDE4IDEyLjM3MTAyMzYsMTUuMDU2MDI4NCAxMi4xMzc3ODkyLDE0LjUzNTU4IEwxMC45NjY5NjI3LDExLjkyNTcyOCBMMTMuOTI1ODUzLDExLjkyNTcyOCBDMTQuNTEzMDQ4NiwxMS45MjU3MjggMTQuNzkzNzY5MywxMS4yMTIxOTQ4IDE0LjM2MjM4NjUsMTAuODE5MDQ5NSBMNy4wNzkxMDA3LDQuMTcwMDQyOTQgQzYuNjY3MDMzNiwzLjc5MzQ5MTQgNiw0LjA4MzI0NDYyIDYsNC42Mzg0OTg1NyBMNiwxNC41MDI4NzIyIEM2LDE1LjA5MDAzNzMgNi43MzAxMzEzOCwxNS4zNjU3NDk2IDcuMTIyODgyODIsMTQuOTI3OTI4NyBMOS4wODQ4MDcwOSwxMi43NTE5MTMxIFoiIGlkPSJzZWxlY3QtaWNvbiI+PC9wYXRoPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+`} 
    />
  );
});
KidFriendlySelectIcon.displayName = 'KidFriendlySelectIcon';

export const KiddoDrawIcon = memo<BareIconProps>(({ size = 24, color, title, ...rest }) => {
  return (
    <BaseSvg size={size} title={title} {...rest}>
      {/* Canvas/frame */}
      <rect x={3.5} y={3.5} width={12} height={12} rx={1.5} fill="#fff" stroke="#4A4A4A" strokeWidth={1.8}/>
      {/* Drawing line */}
      <path d="M6 12c1-2 2-3 3-3s2 2 4 1" stroke="#E84C8A" strokeWidth={2} fill="none" strokeLinecap="round"/>
      {/* Crayon */}
      <rect x={13} y={13} width={8} height={3} rx={1.5} fill="#4C97FF" stroke="#2B5F99" strokeWidth={1.5}/>
      <rect x={15.5} y={14} width={3} height={1} rx={0.5} fill="#7CB9FF" opacity={0.5}/>
      <path d="M13.5 14.5L11 17" stroke="#E84C8A" strokeWidth={2.5} strokeLinecap="round"/>
      {/* Sparkle */}
      <path d="M18 9l.3 1.2 1.2.3-1.2.3-.3 1.2-.3-1.2-1.2-.3 1.2-.3.3-1.2z" fill="#FFB700"/>
    </BaseSvg>
  );
});
KiddoDrawIcon.displayName = 'KiddoDrawIcon';

export const KiddoRemoveIcon = memo<BareIconProps>(({ size = 24, color, title, ...rest }) => {
  return (
    <BaseSvg size={size} title={title} {...rest}>
      {/* Crayon/eraser body */}
      <rect x={8} y={4} width={8} height={14} rx={1.5} fill="#FF8BA6" stroke="#D65A7A" strokeWidth={1.8}/>
      <ellipse cx={12} cy={4.5} rx={4} ry={1.5} fill="#FFB4C8"/>
      <rect x={8.5} y={8} width={7} height={3} rx={0.8} fill="#FFA0B8" opacity={0.6}/>
      {/* Eraser marks */}
      <path d="M4 19c.5-.5 1-1 1.5-1" stroke="#FFB700" strokeWidth={2} strokeLinecap="round"/>
      <path d="M6.5 20c1-.5 2-1 3-1.5" stroke="#00D68F" strokeWidth={2} strokeLinecap="round"/>
      {/* Sparkles/dust */}
      <circle cx={5} cy={17} r={0.8} fill="#FFAB19" opacity={0.8}/>
      <circle cx={7} cy={19} r={0.6} fill="#00D3FF" opacity={0.8}/>
      <circle cx={19} cy={16} r={0.7} fill="#A0D900" opacity={0.8}/>
    </BaseSvg>
  );
});
KiddoRemoveIcon.displayName = 'KiddoRemoveIcon';

export const KiddoEraserIcon = memo<BareIconProps>(({ size = 24, color, title, ...rest }) => {
  return (
    <BaseSvg size={size} title={title} {...rest}>
      {/* Eraser body with face */}
      <rect x={6} y={8} width={12} height={10} rx={2} fill="#FF99B5" stroke="#D65A7A" strokeWidth={1.8}/>
      <rect x={6} y={8} width={12} height={4} rx={2} fill="#4CB8E8" stroke="#2B87B5" strokeWidth={1.8}/>
      {/* Face */}
      <circle cx={11} cy={13.5} r={0.9} fill="#4A3F6B"/>
      <circle cx={13} cy={13.5} r={0.9} fill="#4A3F6B"/>
      <path d="M10.5 15.5c.4.2.9.3 1.5.3s1.1-.1 1.5-.3" stroke="#4A3F6B" strokeWidth={1.2} strokeLinecap="round"/>
      {/* Eraser marks */}
      <path d="M3 19l2-2" stroke="#C9C9C9" strokeWidth={2.5} strokeLinecap="round" opacity={0.4}/>
      <path d="M19 19l2-2" stroke="#C9C9C9" strokeWidth={2.5} strokeLinecap="round" opacity={0.4}/>
      {/* Sparkles */}
      <circle cx={4} cy={16} r={0.7} fill="#E0E0E0"/>
      <circle cx={20} cy={16} r={0.7} fill="#E0E0E0"/>
    </BaseSvg>
  );
});
KiddoEraserIcon.displayName = 'KiddoEraserIcon';

export const KiddoUndoIcon = memo<BareIconProps & { dir?: 'ltr' | 'rtl' | 'auto' }>(
  ({ size = 24, color, title, dir = 'auto', ...rest }) => {
    const d = getDir(dir);
    const isRTL = d === 'rtl';
    return (
      <BaseSvg size={size} title={title} {...rest}>
        {isRTL ? (
          <>
            {/* Arrow pointing right for RTL */}
            <path d="M16 6c3.3 0 6 2.7 6 6s-2.7 6-6 6H6" stroke="#4CB8E8" strokeWidth={2.5} fill="none" strokeLinecap="round"/>
            <path d="M10 14l-4 4-4-4" stroke="#4CB8E8" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            {/* Building blocks */}
            <rect x={16} y={7} width={3} height={3} rx={0.5} fill="#FFB700" stroke="#D99300" strokeWidth={1.2}/>
            <rect x={17} y={10} width={3} height={3} rx={0.5} fill="#E84C8A" stroke="#B83265" strokeWidth={1.2}/>
          </>
        ) : (
          <>
            {/* Arrow pointing left */}
            <path d="M8 6C4.7 6 2 8.7 2 12s2.7 6 6 6h12" stroke="#4CB8E8" strokeWidth={2.5} fill="none" strokeLinecap="round"/>
            <path d="M14 14l4 4 4-4" stroke="#4CB8E8" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            {/* Building blocks */}
            <rect x={5} y={7} width={3} height={3} rx={0.5} fill="#FFB700" stroke="#D99300" strokeWidth={1.2}/>
            <rect x={4} y={10} width={3} height={3} rx={0.5} fill="#E84C8A" stroke="#B83265" strokeWidth={1.2}/>
          </>
        )}
        {/* Sparkle */}
        <path d="M12 4l.2.8.8.2-.8.2-.2.8-.2-.8-.8-.2.8-.2.2-.8z" fill="#00D68F"/>
      </BaseSvg>
    );
  }
);
KiddoUndoIcon.displayName = 'KiddoUndoIcon';

export const KiddoRedoIcon = memo<BareIconProps & { dir?: 'ltr' | 'rtl' | 'auto' }>(
  ({ size = 24, color, title, dir = 'auto', ...rest }) => {
    const d = getDir(dir);
    const isRTL = d === 'rtl';
    return (
      <BaseSvg size={size} title={title} {...rest}>
        {isRTL ? (
          <>
            {/* Arrow pointing left for RTL */}
            <path d="M8 6C4.7 6 2 8.7 2 12s2.7 6 6 6h12" stroke="#00D68F" strokeWidth={2.5} fill="none" strokeLinecap="round"/>
            <path d="M14 14l4 4 4-4" stroke="#00D68F" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </>
        ) : (
          <>
            {/* Arrow pointing right */}
            <path d="M16 6c3.3 0 6 2.7 6 6s-2.7 6-6 6H6" stroke="#00D68F" strokeWidth={2.5} fill="none" strokeLinecap="round"/>
            <path d="M10 14l-4 4-4-4" stroke="#00D68F" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </>
        )}
        {/* Sparkle */}
        <path d="M12 4l.2.8.8.2-.8.2-.2.8-.2-.8-.8-.2.8-.2.2-.8z" fill="#FFB700"/>
      </BaseSvg>
    );
  }
);
KiddoRedoIcon.displayName = 'KiddoRedoIcon';

export const KiddoImportIcon = memo<BareIconProps>(({ size = 24, color, title, ...rest }) => {
  return (
    <BaseSvg size={size} title={title} {...rest}>
      {/* Camera body */}
      <rect x={4} y={7} width={16} height={12} rx={2.5} fill="#FFB84D" stroke="#CC8F3D" strokeWidth={1.8}/>
      <rect x={5.5} y={8.5} width={3} height={1.5} rx={0.5} fill="#FFC873"/>
      {/* Lens */}
      <circle cx={12} cy={13} r={4.5} fill="#4CB8E8" stroke="#2B87B5" strokeWidth={1.8}/>
      <circle cx={12} cy={13} r={2.8} fill="#2B5F99" stroke="#1A3E6B" strokeWidth={1.2}/>
      <circle cx={13.2} cy={11.8} r={1.2} fill="#7CB9FF" opacity={0.7}/>
      {/* Flash */}
      <circle cx={17.5} cy={9.5} r={1.2} fill="#E84C8A"/>
      {/* Sparkle */}
      <path d="M19 16l.3 1 1 .3-1 .3-.3 1-.3-1-1-.3 1-.3.3-1z" fill="#FFB700"/>
    </BaseSvg>
  );
});
KiddoImportIcon.displayName = 'KiddoImportIcon';

export const KiddoPaintIcon = memo<BareIconProps>(({ size = 24, color, title, ...rest }) => {
  return (
    <BaseSvg size={size} title={title} {...rest}>
      {/* Paint splat */}
      <path d="M12 3c-2 0-3.5 1-4.5 2.5-1 1.5-1.5 3.5-1 5.5.5 2 2 3.5 3.5 4.5 1.5 1 3.5 1.5 5.5 1s3.5-2 4.5-3.5c1-1.5 1.5-3.5 1-5.5-.5-2-2-3.5-3.5-4.5C16 3.5 14 3 12 3z" fill="#4CB8E8"/>
      <path d="M10 6c-1 .5-1.5 1.5-1.5 2.5s.5 2 1.5 2.5c1 .5 2 .5 3 0s1.5-1.5 1.5-2.5S14 6.5 13 6c-1-.5-2-.5-3 0z" fill="#E84C8A"/>
      <path d="M15 10c.5.5 1 1 1 2s-.5 1.5-1 2-1 1-2 1-1.5-.5-2-1-.5-1-.5-2 0-1.5.5-2" fill="#FFB700"/>
      {/* Building blocks */}
      <rect x={16} y={14} width={3.5} height={3.5} rx={0.5} fill="#E84C8A" stroke="#B83265" strokeWidth={1.2}/>
      <rect x={18} y={17} width={3.5} height={3.5} rx={0.5} fill="#FFB700" stroke="#D99300" strokeWidth={1.2}/>
      <rect x={14.5} y={17.5} width={3.5} height={3.5} rx={0.5} fill="#00D68F" stroke="#00A36C" strokeWidth={1.2}/>
      {/* Sparkles */}
      <circle cx={6} cy={15} r={0.8} fill="#A0D900"/>
      <circle cx={8} cy={18} r={0.6} fill="#00D3FF"/>
    </BaseSvg>
  );
});
KiddoPaintIcon.displayName = 'KiddoPaintIcon';

export const KiddoLayersIcon = memo<BareIconProps>(({ size = 24, color, title, ...rest }) => {
  return (
    <BaseSvg size={size} title={title} {...rest}>
      {/* Landscape layers */}
      {/* Sky */}
      <path d="M3 6h18v5c0 0-3-1-6-1s-6 1-6 1-3-1-6-1V6z" fill="#FFE5A3"/>
      <rect x={3} y={5} width={18} height={4} rx={1.5} fill="#FFD27F" stroke="#CC9F5F" strokeWidth={1.5}/>
      {/* Sun */}
      <circle cx={18} cy={8} r={1.8} fill="#FFB700"/>
      <circle cx={18} cy={8} r={1.2} fill="#FFCC4D"/>

      {/* Water/middle layer */}
      <rect x={3} y={11} width={18} height={4} rx={1.5} fill="#7CB9FF" stroke="#4C97FF" strokeWidth={1.5}/>

      {/* Ground */}
      <rect x={3} y={17} width={18} height={4} rx={1.5} fill="#00D68F" stroke="#00A36C" strokeWidth={1.5}/>
      {/* Tree */}
      <circle cx={8} cy={19} r={1.3} fill="#4CB84D" stroke="#2B8F2D" strokeWidth={1}/>

      {/* Sparkle */}
      <path d="M20 3l.3 1 1 .3-1 .3-.3 1-.3-1-1-.3 1-.3.3-1z" fill="#00D3FF"/>
    </BaseSvg>
  );
});
KiddoLayersIcon.displayName = 'KiddoLayersIcon';

export const KiddoSaveIcon = memo<BareIconProps>(({ size = 24, color, title, ...rest }) => {
  return (
    <BaseSvg size={size} title={title} {...rest}>
      {/* Floppy disk */}
      <rect x={4} y={3} width={16} height={18} rx={2} fill="#E84C8A" stroke="#B83265" strokeWidth={1.8}/>
      <rect x={4} y={3} width={16} height={5} rx={2} fill="#FF99B5"/>
      <rect x={7} y={4.5} width={6} height={2} rx={0.5} fill="#fff" opacity={0.8}/>
      {/* Heart */}
      <path d="M12 17c-3-2-4-3.5-4-5 0-1.5 1-2.5 2.5-2.5.8 0 1.5.3 2 .8.5-.5 1.2-.8 2-.8 1.5 0 2.5 1 2.5 2.5 0 1.5-1 3-4 5z" fill="#fff"/>
      <path d="M12 17c-3-2-4-3.5-4-5 0-1.5 1-2.5 2.5-2.5.8 0 1.5.3 2 .8.5-.5 1.2-.8 2-.8 1.5 0 2.5 1 2.5 2.5 0 1.5-1 3-4 5z" stroke="#FFB4C8" strokeWidth={1.2} fill="none"/>
      {/* Label */}
      <rect x={15.5} y={4.5} width={2.5} height={2} rx={0.3} fill="#4A3F6B"/>
      {/* Sparkle */}
      <path d="M19 19l.3 1 1 .3-1 .3-.3 1-.3-1-1-.3 1-.3.3-1z" fill="#FFB700"/>
    </BaseSvg>
  );
});
KiddoSaveIcon.displayName = 'KiddoSaveIcon';

export const KiddoCropIcon = memo<BareIconProps>(({ size = 24, color, title, ...rest }) => {
  return (
    <BaseSvg size={size} title={title} {...rest}>
      {/* Scissors */}
      <circle cx={8} cy={7} r={2.2} fill="#E84C8A" stroke="#B83265" strokeWidth={1.5}/>
      <circle cx={8} cy={7} r={1} fill="#fff"/>
      <circle cx={8} cy={17} r={2.2} fill="#E84C8A" stroke="#B83265" strokeWidth={1.5}/>
      <circle cx={8} cy={17} r={1} fill="#fff"/>

      {/* Blades */}
      <path d="M9 8l6 4" stroke="#5A5A5A" strokeWidth={2} strokeLinecap="round"/>
      <path d="M9 16l6-4" stroke="#5A5A5A" strokeWidth={2} strokeLinecap="round"/>

      {/* Dashed line */}
      <line x1={16} y1={9} x2={20} y2={9} stroke="#4A4A4A" strokeWidth={1.5} strokeDasharray="2 2"/>
      <line x1={16} y1={12} x2={20} y2={12} stroke="#4A4A4A" strokeWidth={1.5} strokeDasharray="2 2"/>
      <line x1={16} y1={15} x2={20} y2={15} stroke="#4A4A4A" strokeWidth={1.5} strokeDasharray="2 2"/>

      {/* Sparkle */}
      <path d="M18 5l.2.8.8.2-.8.2-.2.8-.2-.8-.8-.2.8-.2.2-.8z" fill="#00D68F"/>
    </BaseSvg>
  );
});
KiddoCropIcon.displayName = 'KiddoCropIcon';

export const KiddoZoomInIcon = memo<BareIconProps>(({ size = 24, color, title, ...rest }) => {
  return (
    <BaseSvg size={size} title={title} {...rest}>
      {/* Magnifying glass */}
      <circle cx={10} cy={10} r={6.5} fill="#fff" stroke="#4CB8E8" strokeWidth={2.5}/>
      <circle cx={10} cy={10} r={4.5} fill="#E6F7FF" stroke="#4CB8E8" strokeWidth={1.5}/>

      {/* Plus sign */}
      <line x1={10} y1={7.5} x2={10} y2={12.5} stroke="#4C97FF" strokeWidth={2} strokeLinecap="round"/>
      <line x1={7.5} y1={10} x2={12.5} y2={10} stroke="#4C97FF" strokeWidth={2} strokeLinecap="round"/>

      {/* Handle */}
      <path d="M15 15l5 5" stroke="#FFB700" strokeWidth={3} strokeLinecap="round"/>
      <circle cx={20} cy={20} r={1.5} fill="#FFCC4D"/>

      {/* Sparkle */}
      <path d="M17 7l.2.8.8.2-.8.2-.2.8-.2-.8-.8-.2.8-.2.2-.8z" fill="#00D68F"/>
    </BaseSvg>
  );
});
KiddoZoomInIcon.displayName = 'KiddoZoomInIcon';

export const KiddoZoomOutIcon = memo<BareIconProps>(({ size = 24, color, title, ...rest }) => {
  return (
    <BaseSvg size={size} title={title} {...rest}>
      {/* Magnifying glass */}
      <circle cx={10} cy={10} r={6.5} fill="#fff" stroke="#4CB8E8" strokeWidth={2.5}/>
      <circle cx={10} cy={10} r={4.5} fill="#E6F7FF" stroke="#4CB8E8" strokeWidth={1.5}/>

      {/* Minus sign */}
      <line x1={7.5} y1={10} x2={12.5} y2={10} stroke="#4C97FF" strokeWidth={2} strokeLinecap="round"/>

      {/* Handle */}
      <path d="M15 15l5 5" stroke="#FFB700" strokeWidth={3} strokeLinecap="round"/>
      <circle cx={20} cy={20} r={1.5} fill="#FFCC4D"/>

      {/* Sparkle */}
      <path d="M17 7l.2.8.8.2-.8.2-.2.8-.2-.8-.8-.2.8-.2.2-.8z" fill="#00D68F"/>
    </BaseSvg>
  );
});
KiddoZoomOutIcon.displayName = 'KiddoZoomOutIcon';

export const KiddoAddTextIcon = memo<BareIconProps>(({ size = 24, color, title, ...rest }) => {
  return (
    <BaseSvg size={size} title={title} {...rest}>
      {/* Thought bubble */}
      <ellipse cx={12} cy={10} rx={8} ry={6} fill="#fff" stroke="#4A4A4A" strokeWidth={2}/>
      <circle cx={7} cy={15} r={1.5} fill="#fff" stroke="#4A4A4A" strokeWidth={1.5}/>
      <circle cx={5} cy={17.5} r={1.2} fill="#fff" stroke="#4A4A4A" strokeWidth={1.5}/>

      {/* ABC text */}
      <text x="12" y="12" fontFamily="Arial, sans-serif" fontSize="7" fontWeight="bold" fill="#4C97FF" textAnchor="middle">ABC</text>

      {/* Make text colorful manually with paths instead */}
      <path d="M8.5 9l.8 3h-1.6l.8-3z M8.5 9l.4-1.2h.2L9.5 9" fill="#E84C8A"/>
      <path d="M10.5 7.8v4h1.2c.6 0 1-.4 1-1v-2c0-.6-.4-1-1-1h-1.2z" fill="#FFB700"/>
      <path d="M14 7.8c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1h1v-1h-.8v-2h.8v-1h-1z" fill="#00D68F"/>

      {/* Sparkles */}
      <path d="M19 5l.3 1 1 .3-1 .3-.3 1-.3-1-1-.3 1-.3.3-1z" fill="#FFB700"/>
      <path d="M4 7l.2.6.6.2-.6.2-.2.6-.2-.6-.6-.2.6-.2.2-.6z" fill="#00D3FF"/>
    </BaseSvg>
  );
});
KiddoAddTextIcon.displayName = 'KiddoAddTextIcon';
