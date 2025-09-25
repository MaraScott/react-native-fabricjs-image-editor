import { type ReactNode, type SVGAttributes } from 'react';

export type MaterialCommunityIconName =
  | 'cursor-default'
  | 'pencil-outline'
  | 'vector-polyline'
  | 'rectangle-outline'
  | 'circle-outline'
  | 'ellipse-outline'
  | 'triangle-outline'
  | 'ray-start-end'
  | 'format-text'
  | 'image-outline'
  | 'arrow-collapse-horizontal'
  | 'arrow-collapse-vertical'
  | 'undo'
  | 'redo'
  | 'content-copy'
  | 'content-paste'
  | 'content-duplicate'
  | 'trash-can-outline'
  | 'eraser-variant'
  | 'content-save-outline'
  | 'folder-open-outline'
  | 'file-image'
  | 'file-jpg-box'
  | 'svg'
  | 'code-json';

export interface MaterialCommunityIconsProps extends Omit<SVGAttributes<SVGSVGElement>, 'color'> {
  readonly name: MaterialCommunityIconName;
  readonly size?: number;
  readonly color?: string;
}

type RenderContext = Required<Pick<MaterialCommunityIconsProps, 'size' | 'color'>> &
  Omit<MaterialCommunityIconsProps, 'size' | 'color' | 'name'>;

type IconRenderer = (context: RenderContext) => JSX.Element;

function createSvg({ size, color, strokeWidth = 1.75, ...rest }: RenderContext, children: ReactNode): JSX.Element {
  return (
    <svg
      aria-hidden
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

function renderFallbackIcon(context: RenderContext): JSX.Element {
  return createSvg(context, <circle cx={12} cy={12} r={8} strokeDasharray="1 3" />);
}

function renderCursorDefault(context: RenderContext): JSX.Element {
  return createSvg(
    context,
    <>
      <polygon
        points="5 3 11 18.5 13.5 12.5 19 10.5 5 3"
        fill={context.color}
        fillOpacity={0.85}
        stroke="none"
      />
      <line x1={13.25} y1={12.75} x2={19} y2={10.5} />
      <line x1={11} y1={18.5} x2={13.5} y2={12.5} />
    </>,
  );
}

function renderPencilOutline(context: RenderContext): JSX.Element {
  return createSvg(
    context,
    <>
      <path d="M4 15.75l.75-3 9-9 3.5 3.5-9 9-3 .75z" fill={context.color} fillOpacity={0.2} stroke="none" />
      <path d="M4 15.75l-.75 3.75L7 18.75" />
      <path d="M12.75 3.75l3.5 3.5" />
      <path d="M6.5 17l2.5 2.5" />
    </>,
  );
}

function renderVectorPolyline(context: RenderContext): JSX.Element {
  return createSvg(
    context,
    <>
      <polyline points="4 5 9 5 12 12 16 9 20 9" />
      <circle cx={4} cy={5} r={1.6} fill={context.color} />
      <circle cx={9} cy={5} r={1.6} fill={context.color} />
      <circle cx={12} cy={12} r={1.6} fill={context.color} />
      <circle cx={16} cy={9} r={1.6} fill={context.color} />
      <circle cx={20} cy={9} r={1.6} fill={context.color} />
    </>,
  );
}

function renderRectangleOutline(context: RenderContext): JSX.Element {
  return createSvg(context, <rect x={4.5} y={6.5} width={15} height={11} rx={2.5} />);
}

function renderCircleOutline(context: RenderContext): JSX.Element {
  return createSvg(context, <circle cx={12} cy={12} r={6.5} />);
}

function renderEllipseOutline(context: RenderContext): JSX.Element {
  return createSvg(context, <ellipse cx={12} cy={12} rx={7.5} ry={5.5} />);
}

function renderTriangleOutline(context: RenderContext): JSX.Element {
  return createSvg(context, <polygon points="12 5 4.5 18 19.5 18 12 5" fill="none" />);
}

function renderRayStartEnd(context: RenderContext): JSX.Element {
  return createSvg(
    context,
    <>
      <line x1={5} y1={12} x2={19} y2={12} />
      <polyline points="8 9 5 12 8 15" />
      <polyline points="16 9 19 12 16 15" />
    </>,
  );
}

function renderFormatText(context: RenderContext): JSX.Element {
  return createSvg(
    context,
    <>
      <path d="M5 18h14" />
      <path d="M9 18v-8a1 1 0 0 1 1-1h4" />
      <path d="M19 9h-8" />
      <path d="M13 9v9" />
    </>,
  );
}

function renderImageOutline(context: RenderContext): JSX.Element {
  return createSvg(
    context,
    <>
      <rect x={4.5} y={5.5} width={15} height={13} rx={1.8} />
      <circle cx={9} cy={10} r={1.6} fill={context.color} />
      <path d="M5 16l4-4 3.5 3.5 2.5-2.5 4 4" />
    </>,
  );
}

function renderArrowCollapseHorizontal(context: RenderContext): JSX.Element {
  return createSvg(
    context,
    <>
      <polyline points="8.5 9 5.5 12 8.5 15" />
      <polyline points="15.5 9 18.5 12 15.5 15" />
      <line x1={5.5} y1={12} x2={18.5} y2={12} strokeDasharray="1.5 1.5" />
    </>,
  );
}

function renderArrowCollapseVertical(context: RenderContext): JSX.Element {
  return createSvg(
    context,
    <>
      <polyline points="9 8.5 12 5.5 15 8.5" />
      <polyline points="9 15.5 12 18.5 15 15.5" />
      <line x1={12} y1={5.5} x2={12} y2={18.5} strokeDasharray="1.5 1.5" />
    </>,
  );
}

function renderUndo(context: RenderContext): JSX.Element {
  return createSvg(
    context,
    <>
      <path d="M7 9H3v-4" />
      <path d="M3 9a9 9 0 0 1 16.2 4" />
    </>,
  );
}

function renderRedo(context: RenderContext): JSX.Element {
  return createSvg(
    context,
    <>
      <path d="M17 9h4V5" />
      <path d="M21 9a9 9 0 0 0-16.2 4" />
    </>,
  );
}

function renderContentCopy(context: RenderContext): JSX.Element {
  return createSvg(
    context,
    <>
      <rect x={7} y={7} width={10} height={12} rx={1.8} />
      <rect x={5} y={5} width={10} height={12} rx={1.8} opacity={0.35} />
    </>,
  );
}

function renderContentPaste(context: RenderContext): JSX.Element {
  return createSvg(
    context,
    <>
      <rect x={7} y={5} width={10} height={14} rx={2} />
      <rect x={9} y={3.5} width={6} height={3} rx={1} />
    </>,
  );
}

function renderContentDuplicate(context: RenderContext): JSX.Element {
  return createSvg(
    context,
    <>
      <rect x={6} y={8} width={10} height={12} rx={1.8} />
      <rect x={8} y={4} width={10} height={12} rx={1.8} opacity={0.35} />
    </>,
  );
}

function renderTrashCanOutline(context: RenderContext): JSX.Element {
  return createSvg(
    context,
    <>
      <path d="M5.5 7h13" />
      <path d="M9 7V5.5a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5V7" />
      <rect x={6.5} y={7} width={11} height={12} rx={2} />
      <line x1={10} y1={10.5} x2={10} y2={16.5} />
      <line x1={14} y1={10.5} x2={14} y2={16.5} />
    </>,
  );
}

function renderEraserVariant(context: RenderContext): JSX.Element {
  return createSvg(
    context,
    <>
      <path
        d="M5 15l7.25-7.25a1.5 1.5 0 0 1 2.12 0L19 12.38l-6.25 6.25H8.12a1.5 1.5 0 0 1-1.06-.44L5 17.12a1.5 1.5 0 0 1 0-2.12z"
        fill={context.color}
        fillOpacity={0.2}
        stroke="none"
      />
      <path d="M5 15l4.5 4.5" />
      <path d="M12.25 7.75L19 14.5" />
    </>,
  );
}

function renderContentSaveOutline(context: RenderContext): JSX.Element {
  return createSvg(
    context,
    <>
      <path d="M6.5 5.5h9l2 2v11h-11a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z" />
      <rect x={9} y={5.5} width={6} height={4} />
      <rect x={9} y={13} width={6} height={3.5} rx={0.75} />
    </>,
  );
}

function renderFolderOpenOutline(context: RenderContext): JSX.Element {
  return createSvg(
    context,
    <path d="M4 18.5h13.5a1.5 1.5 0 0 0 1.44-1.12l1.56-6.38a1 1 0 0 0-.97-1.25H10l-1.6-3.2a1.5 1.5 0 0 0-1.35-.85H4a1 1 0 0 0-1 1v10a1.5 1.5 0 0 0 1 1.4z" />,
  );
}

function renderFileImage(context: RenderContext): JSX.Element {
  return createSvg(
    context,
    <>
      <path d="M8 4.5h6.5l3 3V19a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1z" />
      <circle cx={11} cy={10} r={1.4} fill={context.color} />
      <path d="M9 16l2.5-2.5 2 2 2.5-2.5 2 2.5" />
    </>,
  );
}

function renderFileJpgBox(context: RenderContext): JSX.Element {
  return createSvg(
    context,
    <>
      <rect x={4.5} y={4.5} width={15} height={15} rx={1.5} />
      <text x="7.8" y="15.1" fontSize="5" fontFamily="monospace" fill={context.color} stroke="none">
        JPG
      </text>
    </>,
  );
}

function renderSvg(context: RenderContext): JSX.Element {
  return createSvg(
    context,
    <text x="6" y="16" fontSize="8" fontFamily="monospace" fontWeight="600" fill={context.color} stroke="none">
      SVG
    </text>,
  );
}

function renderCodeJson(context: RenderContext): JSX.Element {
  return createSvg(
    context,
    <>
      <polyline points="8 8.5 4.5 12 8 15.5" />
      <polyline points="16 8.5 19.5 12 16 15.5" />
      <line x1={11} y1={7} x2={13} y2={17} />
    </>,
  );
}

const ICON_RENDERERS: Record<MaterialCommunityIconName, IconRenderer> = {
  'cursor-default': renderCursorDefault,
  'pencil-outline': renderPencilOutline,
  'vector-polyline': renderVectorPolyline,
  'rectangle-outline': renderRectangleOutline,
  'circle-outline': renderCircleOutline,
  'ellipse-outline': renderEllipseOutline,
  'triangle-outline': renderTriangleOutline,
  'ray-start-end': renderRayStartEnd,
  'format-text': renderFormatText,
  'image-outline': renderImageOutline,
  'arrow-collapse-horizontal': renderArrowCollapseHorizontal,
  'arrow-collapse-vertical': renderArrowCollapseVertical,
  undo: renderUndo,
  redo: renderRedo,
  'content-copy': renderContentCopy,
  'content-paste': renderContentPaste,
  'content-duplicate': renderContentDuplicate,
  'trash-can-outline': renderTrashCanOutline,
  'eraser-variant': renderEraserVariant,
  'content-save-outline': renderContentSaveOutline,
  'folder-open-outline': renderFolderOpenOutline,
  'file-image': renderFileImage,
  'file-jpg-box': renderFileJpgBox,
  svg: renderSvg,
  'code-json': renderCodeJson,
};

export function MaterialCommunityIcons({
  name,
  size = 20,
  color = '#0f172a',
  ...rest
}: MaterialCommunityIconsProps) {
  const renderer = ICON_RENDERERS[name] ?? renderFallbackIcon;
  return renderer({ size, color, ...rest });
}

MaterialCommunityIcons.displayName = 'MaterialCommunityIcons';

