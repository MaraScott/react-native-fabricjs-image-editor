# Complete File Tree

A comprehensive overview of all files in the Konva Image Editor project, organized by purpose and layer.

## Project Root

```
src/
├── README.md                          # Main project documentation
├── LICENSE                            # License file
├── package.json                       # NPM package configuration
├── package-lock.json                  # NPM lock file
├── tsconfig.json                      # TypeScript configuration
├── webpack.config.js                  # Webpack build configuration
├── index.html                         # Development HTML page
├── index.template.html                # HTML template
├── index.tsx                          # Application entry point
├── global.d.ts                        # Global type declarations
└── templates.txt                      # Design templates reference
```

## Documentation (`/doc`)

```
doc/
├── ARCHITECTURE.md                    # Architecture and design patterns
├── COMPONENT_USAGE.md                 # Component usage examples
├── QUICK_REFERENCE.md                 # Developer quick reference
└── FILE_TREE.md                       # This file
```

## TypeScript Types (`/types`)

```
types/
├── editor.ts                          # Core editor types
│   ├── EditorElementType              # Union of element types
│   ├── BaseElement                    # Base element interface
│   ├── RectElement, CircleElement...  # Specific element types
│   ├── EditorLayer                    # Layer definition
│   ├── EditorDocument                 # Document structure
│   ├── EditorDesign                   # Design with options
│   ├── EditorOptions                  # Editor configuration
│   └── EditorBootstrapConfig          # Bootstrap config
├── konva.ts                           # Konva type extensions
│   ├── Vector2d                       # 2D vector type
│   ├── KonvaEventObject               # Konva event types
│   └── StageType                      # Stage type extensions
└── jsxRuntime.d.ts                    # JSX runtime declarations
```

## Business Logic (`/hooks`)

### Core Hooks

```
hooks/
├── useHistory.ts                      # Undo/redo functionality
│   └── useHistory()
│       ├── save()                     # Save current state
│       ├── undo()                     # Go back one step
│       ├── redo()                     # Go forward one step
│       ├── clear()                    # Clear history
│       ├── canUndo                    # Can undo flag
│       └── canRedo                    # Can redo flag
│
└── useImage.ts                        # Image loading hook
    └── useImage(src)
        └── Returns [image, status]   # Image and loading status
```

### Editor Hooks (`/hooks/editor`)

```
hooks/editor/
├── index.ts                           # Export barrel
│
├── useZoomPan.ts                      # Zoom and pan management
│   └── useZoomPan(options)
│       ├── zoom, stagePosition
│       ├── fitScale, zoomBounds
│       ├── workspaceSize
│       ├── isPanMode, isPanning
│       ├── setZoom(), setStagePosition()
│       ├── setIsPanMode()
│       ├── startPanInertia()
│       └── stopInertia()
│
├── useSelection.ts                    # Element selection
│   └── useSelection(options)
│       ├── selectedIds, selectionRect
│       ├── selectElement()
│       ├── selectMultiple()
│       ├── clearSelection()
│       ├── startRectSelection()
│       ├── updateRectSelection()
│       ├── endRectSelection()
│       └── cancelRectSelection()
│
└── useWordPressIntegration.ts         # WordPress API integration
    └── useWordPressIntegration(config)
        ├── isConfigured, isUploading
        ├── uploadMedia()
        ├── fetchUserMedia()
        └── updateConfig()
```

## Utility Functions (`/utils`)

```
utils/
├── editorElements.ts                  # Element factories
│   ├── createBaseElement()
│   ├── createRect(), createCircle()...
│   ├── createText(), createImage()
│   ├── createLayerDefinition()
│   ├── cloneElement()
│   ├── assignElementsToLayer()
│   └── orderElementsByLayer()
│
├── design.ts                          # Design serialization
│   ├── createEmptyDesign()
│   ├── stringifyDesign()
│   └── parseDesign()
│
├── theme.ts                           # Theme management
│   ├── resolveInitialTheme()
│   ├── applyThemeToBody()
│   └── persistTheme()
│
├── ids.ts                             # ID generation
│   └── generateId()
│
└── simpleTsLoader.js                  # TypeScript loader for build
```

## UI Components (`/ui`)

### Atoms - Basic Building Blocks

#### Icons (`/ui/atoms/icons`)

```
ui/atoms/icons/
├── index.ts                           # Export barrel
├── README.md                          # Icons documentation
├── EnhancedIcons.tsx                  # Enhanced icon set (20+ icons)
└── MaterialCommunityIcons.tsx         # Material icons
```

#### Konva Nodes (`/ui/atoms/konva/nodes`)

```
ui/atoms/konva/nodes/
├── index.ts                           # Export barrel
├── common.ts                          # Common utilities
├── RectNode.tsx                       # Rectangle
├── CircleNode.tsx                     # Circle
├── EllipseNode.tsx                    # Ellipse
├── TriangleNode.tsx                   # Triangle
├── LineNode.tsx                       # Line
├── PathNode.tsx                       # Curved path
├── PencilNode.tsx                     # Freehand drawing
├── TextNode.tsx                       # Text with editing
├── ImageNode.tsx                      # Image
├── GuideNode.tsx                      # Guide line
└── FrameNode.tsx                      # Frame container
```

### Molecules - Composite Components

```
ui/molecules/
├── controls/
│   ├── index.ts
│   ├── ZoomControls.tsx               # Zoom buttons
│   └── DrawSettings.tsx               # Color/width picker
│
└── editor/
    └── LayerPreview.tsx               # Layer thumbnail
```

### Organisms - Feature Sections

```
ui/organisms/
├── canvas/
│   ├── index.ts
│   └── EditorCanvas.tsx               # Main Konva canvas
│
└── editor/
    ├── index.ts
    ├── types.ts                       # Organism types
    ├── PrimaryToolbar.tsx             # Main toolbar
    ├── LayersPanel.tsx                # Layers panel
    ├── EditorStageViewport.tsx        # Stage viewport
    ├── ThemeSwitcher.tsx              # Theme toggle
    └── ToolbarActions.tsx             # Toolbar actions
```

### Templates - Page Layouts

```
ui/templates/
├── index.ts                           # Export barrel
├── MediaPickerDialog.tsx              # WP media picker dialog
├── EditorLayout.tsx                   # Main editor layout structure
├── EditorHeader.tsx                   # Editor header bar
└── EditorSidebar.tsx                  # Sidebar content wrapper
```

### Pages - Full Applications

```
ui/pages/editor/
├── index.ts
└── EditorApp.tsx                      # Main editor application
    ├── State Management
    │   ├── elements, layers, options
    │   ├── tool, theme
    │   └── selection, zoom/pan
    │
    ├── Hooks Integration
    │   ├── useHistory()
    │   ├── useZoomPan()
    │   ├── useSelection()
    │   └── useWordPressIntegration()
    │
    └── Event Handlers
        ├── Element management
        ├── Tool handling
        ├── Layer management
        ├── History management
        └── Export/import
```

## Build System (`/scripts`)

```
scripts/
├── build.js                           # Production build
├── watch.js                           # Development watch
└── buildShared.js                     # Shared build config
```

## Module Shims (`/shims`)

```
shims/
├── reactKonva.tsx                     # react-konva shim
├── jsxRuntime.ts                      # JSX runtime shim
├── itsFine.ts                         # its-fine shim
└── konvaGlobal.ts                     # Konva global setup
```

## Static Assets (`/assets`)

```
assets/
├── css/
│   └── styles.css                     # Global styles
│
└── vendor/                            # Vendor libraries
    ├── react.production.min.js
    ├── react-dom.production.min.js
    └── konva.min.js
```

## Build Output (`/dist`)

```
dist/                                  # Generated by build
├── editor.bundle.js                   # Bundled application
└── editor.bundle.js.map               # Source map
```

## Statistics

| Layer              | Files | Purpose                      |
|--------------------|-------|------------------------------|
| Types              | 3     | TypeScript definitions       |
| Hooks              | 6     | Business logic               |
| Utils              | 5     | Pure functions               |
| Atoms (Icons)      | 3     | Icon components              |
| Atoms (Konva)      | 13    | Shape wrappers               |
| Molecules          | 3     | Composite components         |
| Organisms          | 7     | Feature sections             |
| Templates          | 4     | Page layouts                 |
| Pages              | 1     | Main application             |
| Build/Config       | 8     | Build scripts                |
| Documentation      | 4     | Comprehensive docs           |
| **Total**          | **57**| Complete codebase            |

## Import Aliases

```typescript
@atoms/*      → ui/atoms/*
@molecules/*  → ui/molecules/*
@organisms/*  → ui/organisms/*
@templates/*  → ui/templates/*
@pages/*      → ui/pages/*
@hooks/*      → hooks/*
@utils/*      → utils/*
@types/*      → types/*
@assets       → assets/*
@editor       → . (src root)
@expo         → ../../../../
@tinyartist/* → ../../../
```

## Key Principles

1. **Separation of Concerns**: Hooks (logic) + Components (UI) + Utils (functions)
2. **Atomic Design**: Atoms → Molecules → Organisms → Templates → Pages
3. **Hook-First**: Logic in hooks, components are pure presentation
4. **Type Safety**: Comprehensive TypeScript types throughout
5. **Clean Dependencies**: No circular imports, clear paths

## Navigation Guide

**To understand the project:**
1. [README.md](../README.md) - Overview
2. [ARCHITECTURE.md](ARCHITECTURE.md) - Deep dive
3. [COMPONENT_USAGE.md](COMPONENT_USAGE.md) - Examples
4. [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick lookup

**To add a feature:**
1. Define types in `types/editor.ts`
2. Create hook in `hooks/`
3. Create component in `ui/`
4. Wire up in `EditorApp.tsx`

**To debug:**
1. Check QUICK_REFERENCE.md
2. Find file in this tree
3. Check implementation
4. Use DevTools

---

*Last updated: 2025-10-03*

