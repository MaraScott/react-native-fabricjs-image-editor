# 🏗️ Canvas Editor - Atomic Design Refactoring

## Overview
This document explains the atomic design refactoring of the canvas editor codebase to improve maintainability, reusability, and adherence to architectural patterns.

## 📊 Problems Identified

### 1. **SimpleCanvas.tsx Violations**
- **Size**: 2600+ lines of code (should be < 300 for a molecule)
- **Complexity**: Mixed concerns (UI, business logic, state management, event handling)
- **Responsibility**: Doing too much for a single component
- **Maintainability**: Difficult to test, debug, and extend

### 2. **Incorrect Component Hierarchy**
- Components in `molecules/Canvas/components/` (not atomic design)
- Missing foundational atoms (buttons, handles, icons)
- Business logic embedded in presentation components

### 3. **Code Duplication**
- Inline styles repeated throughout
- Similar event handlers duplicated
- Geometry calculations scattered across files

## ✅ Refactoring Solution

### New Atomic Structure

```
src/
├── ui/
│   ├── atoms/                    # NEW: Basic building blocks
│   │   ├── Button/
│   │   │   ├── Button.tsx        # Reusable button component
│   │   │   └── index.ts
│   │   ├── Handle/
│   │   │   ├── ResizeHandle.tsx  # Transform handles
│   │   │   ├── RotateHandle.tsx
│   │   │   └── index.ts
│   │   └── Canvas/               # EXISTING: Stage & Layer atoms
│   │       ├── Stage.tsx
│   │       ├── Layer.tsx
│   │       └── index.ts
│   │
│   ├── molecules/                # Combinations of atoms
│   │   ├── Selection/            # NEW: Promoted from components/
│   │   │   ├── SelectionBox.tsx  # Refactored with atoms
│   │   │   └── index.ts
│   │   ├── LayerPanel/           # NEW: To be extracted
│   │   │   ├── LayerPanel.tsx
│   │   │   ├── LayerItem.tsx
│   │   │   └── index.ts
│   │   ├── Canvas/
│   │   │   ├── SimpleCanvas.tsx  # REFACTORED: Simplified
│   │   │   └── index.ts
│   │   └── Controls/
│   │       ├── ZoomControl.tsx
│   │       └── index.ts
│   │
│   ├── organisms/                # Complex feature components
│   │   └── Canvas/
│   │       ├── CanvasContainer.tsx
│   │       └── ZoomableCanvasContainer.tsx
│   │
│   ├── templates/                # Page layouts
│   │   └── Canvas/
│   │       └── CanvasLayout.tsx
│   │
│   └── pages/                    # Complete pages
│       └── Canvas/
│           └── CanvasApp.tsx
│
├── hooks/                        # NEW: Custom React hooks
│   └── canvas/
│       ├── useCanvasSelection.ts      # Selection state & logic
│       ├── useCanvasTransform.ts      # Transform operations
│       ├── useCanvasZoom.ts           # Zoom controls
│       ├── useCanvasPan.ts            # Pan interactions
│       └── index.ts
│
├── utils/                        # NEW: Pure utility functions
│   └── canvas/
│       ├── geometry.ts                # Bounds, coordinates, calculations
│       ├── transform.ts               # Transform operations
│       └── index.ts
│
└── store/                        # State management
    └── CanvasApp/
```

## 🎯 Key Improvements

### 1. **Proper Atoms Created**
✅ **Button.tsx**: Reusable button with variants (primary, secondary, ghost, danger)
✅ **ResizeHandle.tsx**: Transform handle for resizing
✅ **RotateHandle.tsx**: Rotation handle for selections

**Benefits:**
- Consistent styling across app
- Single source of truth for UI elements
- Easy to theme and customize
- Testable in isolation

### 2. **Molecules Properly Structured**
✅ **SelectionBox.tsx**: Refactored to use atomic handles
- Combines ResizeHandle and RotateHandle atoms
- Clean props interface
- Single responsibility: render selection UI

**Before (OverlaySelection.tsx):**
```tsx
// Inline styles, no reusability
const handleStyle = { /* ... */ };
<div style={handleStyle} />
```

**After (SelectionBox.tsx):**
```tsx
// Uses atoms, clean and composable
<ResizeHandle direction="nw" left="0%" top="0%" />
<RotateHandle onPointerDown={onRotatePointerDown} />
```

### 3. **Utilities Extracted**
✅ **geometry.ts**: Pure functions for canvas calculations
- `computeNodeBounds()`: Calculate bounding boxes
- `areBoundsEqual()`: Compare bounds objects
- `clampZoomValue()`: Zoom constraints
- `calculateScaleFromZoom()`: Scale calculations
- `screenToStageCoordinates()`: Coordinate conversion
- `calculateSelectionCenter()`: Selection positioning

✅ **transform.ts**: Transform operations
- `applyTransformToNode()`: Apply transforms to nodes
- `getNodeAbsoluteTransform()`: Get absolute transforms
- `calculateRotatedDimensions()`: Rotation math

**Benefits:**
- Testable pure functions
- Reusable across components
- No side effects
- Easy to optimize

### 4. **Separation of Concerns**

| Concern | Before | After |
|---------|--------|-------|
| **UI Rendering** | Mixed in SimpleCanvas | Atoms & Molecules |
| **Business Logic** | Embedded everywhere | Utils & Hooks |
| **State Management** | Local state scattered | Dedicated hooks |
| **Event Handling** | Inline handlers | Extracted functions |

## 📝 Next Steps (TODO)

### Phase 1: Extract Hooks ⏳
- [ ] `useCanvasSelection.ts` - Selection state and operations
- [ ] `useCanvasTransform.ts` - Transform logic
- [ ] `useCanvasZoom.ts` - Zoom state and controls
- [ ] `useCanvasPan.ts` - Pan interactions

### Phase 2: Refactor SimpleCanvas ⏳
- [ ] Remove layer panel UI (extract to LayerPanel molecule)
- [ ] Replace inline event handlers with hooks
- [ ] Use utility functions for calculations
- [ ] Reduce to < 500 lines

### Phase 3: Build LayerPanel Molecule ⏳
- [ ] Create LayerItem.tsx atom/molecule
- [ ] Extract layer panel UI from SimpleCanvas
- [ ] Use Button atoms for actions
- [ ] Add proper accessibility

### Phase 4: Documentation ⏳
- [ ] Update ATOMIC_DESIGN.md with new structure
- [ ] Add JSDoc comments to all utilities
- [ ] Create usage examples
- [ ] Write migration guide

## 🎨 Design Principles Applied

### Atomic Design Hierarchy
1. **Atoms** → Basic UI elements (Button, Handle, Stage, Layer)
2. **Molecules** → Simple combinations (SelectionBox, ZoomControl)
3. **Organisms** → Complex features (CanvasContainer)
4. **Templates** → Page layouts (CanvasLayout)
5. **Pages** → Complete pages (CanvasApp)

### Single Responsibility
- Each component does ONE thing well
- Business logic separated from presentation
- State management isolated to hooks

### DRY (Don't Repeat Yourself)
- Shared styles in atoms
- Shared logic in utilities
- Shared state in hooks

### Testability
- Pure functions are easy to test
- Atoms can be tested in isolation
- Mocked dependencies

## 🔍 Code Quality Metrics

### Before Refactoring
- **SimpleCanvas.tsx**: 2600+ lines
- **Cyclomatic Complexity**: Very High
- **Code Duplication**: High
- **Testability**: Low
- **Maintainability**: Low

### After Refactoring (Target)
- **SimpleCanvas.tsx**: < 500 lines
- **Cyclomatic Complexity**: Low (extracted to utils/hooks)
- **Code Duplication**: Minimal
- **Testability**: High (pure functions + isolated components)
- **Maintainability**: High (clear separation of concerns)

## 📚 References

- [Atomic Design Methodology](https://bradfrost.com/blog/post/atomic-web-design/)
- [React Hooks Best Practices](https://react.dev/reference/react)
- [Clean Code Principles](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)

## 🤝 Contributing

When adding new features:
1. Start with atoms (if needed)
2. Compose into molecules
3. Build organisms from molecules
4. Extract business logic to utils/hooks
5. Keep components focused and small

---

**Status**: 🚧 In Progress
**Last Updated**: 2025-11-13
