# Atomic Design Implementation

## Overview

The Canvas UI has been refactored to follow **Atomic Design** principles, creating a modular, scalable, and maintainable component architecture.

## Atomic Design Hierarchy

### Level 1: Atoms
**Location**: `src/ui/atoms/Canvas/`

Atoms are the smallest building blocks - simple, single-purpose components that can't be broken down further.

#### IconButton
```typescript
<IconButton 
  icon="+ Add Layer"
  variant="primary"  // primary | secondary | danger
  size="medium"      // small | medium | large
  onClick={handleClick}
/>
```
**Purpose**: Reusable button component with consistent styling
**Variants**: 
- `primary` - Blue background (#4a90e2)
- `secondary` - White background, gray border
- `danger` - Red text (#a11b1b)

**Sizes**: small (0.75rem), medium (0.875rem), large (1rem)

#### FeedbackMessage
```typescript
<FeedbackMessage 
  message="Layer copied!"
  variant="success"  // success | error | info
/>
```
**Purpose**: Temporary notification messages
**Auto-dismissal**: 2 seconds after mount
**Variants**: success (green), error (red), info (blue)

#### LayerToggleButton
```typescript
<LayerToggleButton 
  isOpen={isLayerPanelOpen}
  onClick={togglePanel}
  buttonRef={layerButtonRef}
/>
```
**Purpose**: Specialized button for layer panel visibility
**States**: open (dark background) / closed (light background)

---

### Level 2: Molecules
**Location**: `src/ui/molecules/Canvas/components/`

Molecules are groups of atoms that work together as a unit.

#### LayerItem
```typescript
<LayerItem
  layer={layerDescriptor}
  isSelected={boolean}
  isPrimary={boolean}
  isTop={boolean}
  isBottom={boolean}
  isDragging={boolean}
  dropPosition="above" | "below" | null
  onSelectLayer={(layerId) => void}
  onToggleVisibility={(layerId) => void}
  onCopyLayer={(layerId) => void}
  onDuplicateLayer={(layerId) => void}
  onMoveLayer={(layerId, direction) => void}
  onRemoveLayer={(layerId) => void}
  onDragStart={...}
  onDragEnd={...}
  onDragOver={...}
  onDrop={...}
  onDragLeave={...}
  canDelete={boolean}
/>
```
**Composition**: 
- IconButton (visibility toggle)
- Text button (layer name)
- Multiple IconButtons (actions: copy, duplicate, move up/down/top/bottom, delete)

**Features**:
- Drag-drop support
- Visual feedback for selection/dragging/drop zones
- Conditional styling based on state

#### LayerList
```typescript
<LayerList
  layerControls={layerControlHandlers}
  selectedLayerIds={string[]}
  primaryLayerId={string | null}
  draggingLayerId={string | null}
  setDraggingLayerId={...}
  dragOverLayer={{id: string, position: 'above' | 'below'} | null}
  setDragOverLayer={...}
  handleCopyLayer={...}
  resolveDropPosition={...}
  pendingSelectionRef={...}
/>
```
**Composition**: 
- Multiple LayerItem components
- Empty state message
- Drop zone for bottom reordering

**Features**:
- Scrollable container
- Drag-drop reordering
- Empty state handling

#### SelectionTransformer
```typescript
<SelectionTransformer
  selectionBounds={{x, y, width, height, rotation}}
  selectionState={...}
  handlers={...}
/>
```
**Composition**: Konva Rect + Transformer
**Purpose**: Visual selection boundary with transform handles

#### OverlaySelection
```typescript
<OverlaySelection
  bounds={{x, y, width, height, rotation}}
  position={{x, y}}
  scale={number}
/>
```
**Composition**: SVG overlay
**Purpose**: Out-of-canvas selection visualization

---

### Level 3: Organisms
**Location**: `src/ui/molecules/Canvas/components/`

Organisms are complex UI sections that combine molecules and atoms into functional units.

#### LayerPanel
```typescript
<LayerPanel
  layerControls={layerControlHandlers}
  layerPanelRef={...}
  layerButtonRef={...}
  isLayerPanelOpen={boolean}
  setIsLayerPanelOpen={...}
  copyFeedback={string | null}
  draggingLayerId={string | null}
  setDraggingLayerId={...}
  dragOverLayer={...}
  setDragOverLayer={...}
  selectedLayerIds={string[]}
  primaryLayerId={string | null}
  handleCopyLayer={...}
  resolveDropPosition={...}
  pendingSelectionRef={...}
/>
```

**Composition**:
```
LayerPanel
├── LayerToggleButton (atom)
└── Panel Container (conditional)
    ├── Header
    │   ├── Title text
    │   └── Close button (native)
    ├── IconButton "Add Layer" (atom)
    ├── FeedbackMessage (atom, conditional)
    └── LayerList (molecule)
        └── LayerItem[] (molecules)
```

**Features**:
- Full layer management interface
- Drag-drop reordering
- Add/remove/duplicate layers
- Toggle visibility
- Copy layer details
- Visual feedback

---

## Benefits of Atomic Design

### 1. Reusability
- Atoms like IconButton can be used anywhere
- Molecules like LayerItem can be repurposed for other list UIs

### 2. Maintainability
- Changes to button styling happen in one place (IconButton)
- Bug fixes propagate to all usages automatically

### 3. Testability
- Small, focused components are easier to unit test
- Isolated concerns reduce test complexity

### 4. Scalability
- New features built by composing existing atoms/molecules
- Consistent design language across the application

### 5. Developer Experience
- Clear component hierarchy
- Predictable composition patterns
- Self-documenting structure

---

## File Structure

```
src/
├── ui/
│   ├── atoms/
│   │   └── Canvas/
│   │       ├── IconButton.tsx
│   │       ├── FeedbackMessage.tsx
│   │       └── LayerToggleButton.tsx
│   │
│   └── molecules/
│       └── Canvas/
│           └── components/
│               ├── LayerItem.tsx
│               ├── LayerList.tsx
│               ├── LayerPanel.tsx (organism)
│               ├── SelectionTransformer.tsx
│               └── OverlaySelection.tsx
```

---

## Usage Examples

### Creating a new button
```typescript
// Use the IconButton atom with appropriate variant
<IconButton 
  icon="🎨"
  variant="primary"
  size="medium"
  onClick={handleAction}
/>
```

### Creating a new list component
```typescript
// Compose LayerItem molecules with custom logic
<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
  {items.map(item => (
    <LayerItem
      key={item.id}
      layer={item}
      isSelected={selectedId === item.id}
      onSelectLayer={handleSelect}
      // ... other handlers
    />
  ))}
</div>
```

### Creating a new panel
```typescript
// Compose atoms and molecules into an organism
const MyPanel = () => (
  <div>
    <IconButton icon="Settings" variant="primary" onClick={...} />
    <FeedbackMessage message="Saved!" variant="success" />
    <LayerList {...props} />
  </div>
);
```

---

## Migration Notes

If updating from the old monolithic LayerPanel:

1. **Import atoms**: `import { IconButton, FeedbackMessage, LayerToggleButton } from '@atoms/Canvas'`
2. **Import molecules**: `import { LayerList, LayerItem } from '@molecules/Canvas/components'`
3. **Replace inline buttons** with IconButton atoms
4. **Replace inline messages** with FeedbackMessage atoms
5. **Extract repeated patterns** into new molecules

---

## Best Practices

1. **Keep atoms simple**: Single responsibility, no business logic
2. **Molecules should be dumb**: Receive data via props, minimal internal state
3. **Organisms handle complexity**: Connect to hooks, manage state, orchestrate interactions
4. **Consistent naming**: `<ComponentName>` for atoms/molecules, `<FeatureName>` for organisms
5. **Props over children**: Prefer explicit props to composition for clarity
6. **Type everything**: Use TypeScript interfaces for all props

---

## Future Extensions

### Potential New Atoms
- `Badge` - Small labels (layer count, status indicators)
- `Tooltip` - Hover information
- `Switch` - Toggle controls
- `Input` - Text inputs for renaming

### Potential New Molecules
- `LayerSearch` - Filter layers by name
- `LayerGroupHeader` - Collapsible layer groups
- `ActionMenu` - Dropdown for additional actions

### Potential New Organisms
- `CanvasToolbar` - Top toolbar with tools/actions
- `PropertiesPanel` - Right sidebar for selected layer properties
- `HistoryPanel` - Undo/redo visualization
