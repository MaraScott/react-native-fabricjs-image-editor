# TinyArtist Icon System

This directory contains the icon components used throughout the TinyArtist editor, with theme-specific variations optimized for both kid and adult users.

## Icon Components

### MaterialCommunityIcons.tsx
Base icon component that provides a comprehensive set of editor icons using SVG paths.

**Features:**
- Minimal, clean SVG icons
- Customizable size, color, and stroke width
- 24x24 viewBox for consistent scaling
- Optimized for both themes

**Usage:**
```tsx
import { MaterialCommunityIcons } from '@components/icons/MaterialCommunityIcons';

<MaterialCommunityIcons
    name="pencil-outline"
    size={20}
    color="#1e5bc6"
/>
```

### EnhancedIcons.tsx
Theme-aware icon variants with additional decorative elements for the kid theme.

**Kid-Friendly Icons:**
- Larger stroke widths (2.5-2.8px)
- Playful decorative elements (sparkles, dots)
- Brighter, more vibrant colors
- Animated effects on active state
- Size: 22-24px by default

**Professional Icons:**
- Thinner stroke widths (1.5-1.8px)
- Clean, minimal design
- Subtle colors
- No animations
- Size: 18-20px by default

**Usage:**
```tsx
import { EnhancedIcon, KidFriendlyDrawIcon, ProfessionalDrawIcon } from '@components/icons/EnhancedIcons';

// Theme-aware icon with sparkles
<EnhancedIcon
    name="pencil-outline"
    theme="kid"
    showSparkles={true}
    size={24}
/>

// Direct kid-friendly icon
<KidFriendlyDrawIcon size={24} color="#1e5bc6" />

// Direct professional icon
<ProfessionalDrawIcon size={20} color="#0f172a" />
```

## Theme-Specific Styling

### Kid Theme
**Characteristics:**
- **Icon Size:** 22-24px
- **Stroke Width:** 2.2-2.5px
- **Colors:** Vibrant, saturated colors
- **Effects:**
  - Bounce animation on active state
  - Drop shadow glow on hover
  - Pulsing animation for active tools
  - Scale transforms (1.15x on hover)
- **Decorations:** Sparkles, colored dots

**CSS Classes:**
```css
.editor-header button svg {
    width: 22px;
    height: 22px;
    stroke-width: 2.2;
}
```

### Adult Theme
**Characteristics:**
- **Icon Size:** 18-20px
- **Stroke Width:** 1.6-1.8px
- **Colors:** Neutral, professional tones
- **Effects:**
  - Subtle scale on hover (1.08x)
  - No glows or shadows
  - Clean transitions
  - No animations
- **Decorations:** None

**CSS Classes:**
```css
body[data-editor-theme='adult'] .editor-header button svg {
    width: 18px;
    height: 18px;
    stroke-width: 1.6;
}
```

## Available Icons

### Drawing Tools
- `pencil-outline` - Freehand drawing
- `vector-polyline` - Line drawing
- `eraser-variant` - Eraser tool

### Shapes
- `rectangle-outline` - Rectangle shape
- `circle-outline` - Circle shape
- `ellipse-outline` - Ellipse shape
- `triangle-outline` - Triangle shape

### Text & Content
- `format-text` - Text tool
- `image-outline` - Image insertion

### Actions
- `undo` - Undo action
- `redo` - Redo action
- `content-copy` - Copy
- `content-paste` - Paste
- `content-duplicate` - Duplicate
- `trash-can-outline` - Delete

### File Operations
- `content-save-outline` - Save
- `folder-open-outline` - Open
- `file-image` - Image file
- `file-jpg-box` - JPG format
- `svg` - SVG format
- `code-json` - JSON format

### View Controls
- `cursor-default` - Selection tool
- `zoom` - Zoom control
- `arrow-collapse-horizontal` - Horizontal alignment
- `arrow-collapse-vertical` - Vertical alignment
- `ray-start-end` - Alignment/distribution

## Icon Sizing Reference

### Kid Theme
| Context | Size | Stroke Width |
|---------|------|--------------|
| Toolbar buttons | 22px | 2.2 |
| Layer actions | 14px | 2.5 |
| Export buttons | 18px | 2.3 |
| Add layer button | 18px | 2.5 |
| Settings | 20px | 2.2 |

### Adult Theme
| Context | Size | Stroke Width |
|---------|------|--------------|
| Toolbar buttons | 18px | 1.6 |
| Layer actions | 13px | 1.8 |
| Export buttons | 16px | 1.8 |
| Add layer button | 16px | 1.8 |
| Settings | 18px | 1.6 |

## Animations

### Kid Theme Animations

**Icon Bounce** (Active state):
```css
@keyframes iconBounce {
    0%, 100% { transform: scale(1); }
    25% { transform: scale(1.2) rotate(-8deg); }
    50% { transform: scale(1.15); }
    75% { transform: scale(1.2) rotate(8deg); }
}
```

**Icon Pulse** (Active tool indicator):
```css
@keyframes iconPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}
```

### Adult Theme
No animations - clean, professional appearance.

## Customization

### Adding New Icons

1. **Add to MaterialCommunityIcons.tsx:**
```tsx
export type MaterialCommunityIconName =
    | 'existing-icon'
    | 'your-new-icon';  // Add here

const icons: Record<MaterialCommunityIconName, IconRenderer> = {
    'your-new-icon': (props) =>
        createSvg(
            props,
            <>
                {/* Your SVG paths */}
            </>,
        ),
};
```

2. **Create theme variants in EnhancedIcons.tsx:**
```tsx
export const KidFriendlyYourIcon = memo<Omit<MaterialCommunityIconsProps, 'name'>>(
    ({ size = 24, color = '#1e5bc6', ...rest }) => (
        // Kid-friendly version
    ),
);

export const ProfessionalYourIcon = memo<Omit<MaterialCommunityIconsProps, 'name'>>(
    ({ size = 20, color = '#0f172a', ...rest }) => (
        // Professional version
    ),
);
```

3. **Add CSS styling if needed:**
```css
/* Kid theme */
.your-context svg {
    width: 22px;
    height: 22px;
}

/* Adult theme */
body[data-editor-theme='adult'] .your-context svg {
    width: 18px;
    height: 18px;
}
```

## Best Practices

### For Kid Theme
1. Use vibrant, saturated colors
2. Add subtle decorative elements (sparkles, dots)
3. Implement playful animations
4. Use thicker stroke widths for better visibility
5. Make icons larger for easier clicking

### For Adult Theme
1. Use neutral, professional colors
2. Keep design minimal and clean
3. Avoid animations
4. Use thinner strokes for elegance
5. Optimize for information density

### Accessibility
1. Ensure sufficient color contrast
2. Provide meaningful aria-labels
3. Make icons large enough to click (minimum 44px touch target)
4. Support keyboard navigation
5. Test with screen readers

## Performance

- All icons are memoized to prevent unnecessary re-renders
- SVG icons are lightweight and scale perfectly
- CSS animations use GPU-accelerated transforms
- No external icon fonts or images required

## Migration Guide

To switch from basic icons to enhanced theme-aware icons:

**Before:**
```tsx
<MaterialCommunityIcons name="pencil-outline" size={20} />
```

**After:**
```tsx
<EnhancedIcon
    name="pencil-outline"
    theme={editorTheme}
    showSparkles={editorTheme === 'kid'}
    size={editorTheme === 'kid' ? 24 : 20}
/>
```

Or use direct components:
```tsx
{editorTheme === 'kid' ? (
    <KidFriendlyDrawIcon />
) : (
    <ProfessionalDrawIcon />
)}
```
