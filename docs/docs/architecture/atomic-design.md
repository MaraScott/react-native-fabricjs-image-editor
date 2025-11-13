# Simple Canvas - Atomic Design Pattern

This is a simplified canvas implementation following the **Atomic Design Pattern** with Konva.js, providing React and React Native compatibility.

## 🏗️ Architecture Overview

The project follows the Atomic Design methodology, organizing components into five distinct levels:

```
ui/
├── atoms/          # Basic building blocks
├── molecules/      # Simple combinations of atoms
├── organisms/      # Complex UI components
├── templates/      # Page-level layouts
└── pages/          # Complete pages
```

## 📦 Component Hierarchy

### Atoms (`ui/atoms/Canvas/`)
The most basic building blocks of the canvas:

- **Stage** - Wraps Konva Stage, the root canvas container
- **Layer** - Wraps Konva Layer, container for canvas elements

### Molecules (`ui/molecules/Canvas/`)
Simple combinations of atoms:

- **SimpleCanvas** - Combines Stage and Layer into a ready-to-use canvas with basic styling

### Organisms (`ui/organisms/Canvas/`)
Complex, feature-rich components:

- **CanvasContainer** - Full-featured canvas with state management and lifecycle hooks

### Templates (`ui/templates/Canvas/`)
Page-level layout structures:

- **CanvasLayout** - Defines the overall application layout with header, content, and footer areas

### Pages (`ui/pages/Canvas/`)
Complete, specific page implementations:

- **CanvasApp** - The main canvas application page with example shapes

## 🚀 Getting Started

### Build the project:
```bash
npm run build
```

### Watch for changes:
```bash
npm run watch
```

### Open in browser:
Open `index.html` in your browser to see the simple canvas in action.

## 🎨 Usage Example

```tsx
import { CanvasApp } from '@pages/Canvas';

// Use the complete application
<CanvasApp width={800} height={600} backgroundColor="#ffffff" />
```

Or build custom compositions:

```tsx
import { CanvasContainer } from '@organisms/Canvas';
import { Rect, Circle } from 'react-konva';

<CanvasContainer width={800} height={600}>
  <Rect x={50} y={50} width={100} height={100} fill="#4A90E2" />
  <Circle x={250} y={100} radius={50} fill="#E24A4A" />
</CanvasContainer>
```

## 🔧 Technical Details

### React/React Native Compatibility
- Uses `react-konva` shims for cross-platform compatibility
- Global Konva instance loaded via vendor scripts
- Custom JSX runtime for optimal bundle size

### Path Aliases
The following TypeScript path aliases are configured:

- `@atoms/*` → `ui/atoms/*`
- `@molecules/*` → `ui/molecules/*`
- `@organisms/*` → `ui/organisms/*`
- `@templates/*` → `ui/templates/*`
- `@pages/*` → `ui/pages/*`

### Build System
- **esbuild** for fast compilation
- Content hashing for cache busting
- Asset manifest generation
- Fallback bundle for development

## 📁 Project Structure

```
src/
├── index.tsx              # Entry point (simple canvas)
├── index.tsx.backup       # Original complex editor (backup)
├── index.template.html    # HTML template with placeholders
├── index.html            # Generated HTML (do not edit)
├── ui/
│   ├── atoms/
│   │   └── Canvas/
│   │       ├── Stage.tsx
│   │       ├── Layer.tsx
│   │       └── index.ts
│   ├── molecules/
│   │   └── Canvas/
│   │       ├── SimpleCanvas.tsx
│   │       └── index.ts
│   ├── organisms/
│   │   └── Canvas/
│   │       ├── CanvasContainer.tsx
│   │       └── index.ts
│   ├── templates/
│   │   └── Canvas/
│   │       ├── CanvasLayout.tsx
│   │       └── index.ts
│   └── pages/
│       └── Canvas/
│           ├── CanvasApp.tsx
│           └── index.ts
├── shims/                # React/Konva compatibility shims
├── scripts/              # Build scripts
└── assets/              # Static assets (fonts, vendor libs)
```

## 🔄 Restoring the Original Editor

To restore the original complex editor:

```bash
mv index.tsx index-simple.tsx
mv index.tsx.backup index.tsx
npm run build
```

## 🎯 Next Steps

This simple canvas provides a clean foundation for:

1. **Drawing Tools** - Add pencil, shapes, text tools
2. **Layer Management** - Multiple layers, reordering, visibility
3. **Transform Controls** - Move, scale, rotate selected objects
4. **History** - Undo/redo functionality
5. **Export** - Save as PNG, JPG, SVG
6. **Import** - Load images and designs
7. **Collaboration** - Real-time multi-user editing

## 📝 Notes

- The `index.template.html` uses `{{CSS_LINK}}` and `{{JS_SRC}}` placeholders
- Build scripts automatically replace these with hashed bundle names
- Konva is loaded globally from `assets/vendor/konva.min.js`
- React and ReactDOM are also loaded as vendor scripts for optimal performance

## 🐛 Troubleshooting

**Build errors?**
- Ensure all dependencies are installed: `npm install`
- Check that TypeScript paths are resolved correctly

**Canvas not displaying?**
- Check browser console for errors
- Verify vendor scripts are loaded (React, ReactDOM, Konva)
- Ensure `index.html` points to correct bundle

**Want to add more features?**
- Follow the Atomic Design pattern
- Start with atoms, build up to molecules, then organisms
- Keep components simple and focused on a single responsibility
