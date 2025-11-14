# Canvas Architecture - Selection Group Pattern

## Overview
The canvas implements a unified Group-based selection system where the selection UI and selected elements are children of the same Group, enabling cohesive transformation behavior.

## Layer Structure

### Current Architecture (November 14, 2025)

```
Stage (full container dimensions with scale)
├── Layer 1: Background + Stage Mimic (non-interactive)
│   ├── Rect (container background)
│   └── Rect (stage mimic with shadow)
│
├── Layer 2-N: Content Layers (one per user layer)
│   └── Layer (positioned with stageViewportOffset)
│       └── {layer.render()} - layer content
│
└── Layer N+1: Selection Layer
    ├── Rect (selectionProxyRef - invisible, for Transformer)
    ├── Transformer (selectionTransformerRef)
    └── KonvaSelectionBox (when overlaySelectionBox exists)
        └── Group (unified selection + element container)
            ├── Selection UI
            │   ├── Rect (border)
            │   ├── Circle × 4 (corner handles)
            │   ├── Circle × 4 (edge handles)
            │   └── Rotate Handle (Line + Circle)
            └── Element(s) - PROPOSED
```

## Proposed Architecture: Unified Group Pattern

### Target Structure
```
Group (transformations applied here - position, rotation, scale)
├── Selection UI Group
│   ├── Rect (selection border)
│   ├── Circle × 4 (corner resize handles)
│   ├── Circle × 4 (edge resize handles)
│   └── Rotate Handle
│       ├── Line (connector)
│       └── Circle (rotate handle)
└── Element Content
    └── Clone or reference of selected layer(s) content
```

### Coordinate System

**Group Positioning (Center-based with offset)**:
```typescript
<Group
  x={centerX}              // x + width/2
  y={centerY}              // y + height/2
  offsetX={width / 2}      // Makes origin at center
  offsetY={height / 2}
  rotation={rotation}
  scaleX={scaleX}
  scaleY={scaleY}
>
```

**Children Positioning (Relative to center)**:
```typescript
// Selection border
<Rect x={-width/2} y={-height/2} width={width} height={height} />

// Corner handles
<Circle x={-width/2} y={-height/2} /> // Top-left
<Circle x={width/2} y={-height/2} />  // Top-right
<Circle x={-width/2} y={height/2} />  // Bottom-left
<Circle x={width/2} y={height/2} />   // Bottom-right

// Edge handles
<Circle x={0} y={-height/2} />  // Top
<Circle x={width/2} y={0} />    // Right
<Circle x={0} y={height/2} />   // Bottom
<Circle x={-width/2} y={0} />   // Left

// Rotate handle
<Line points={[0, -height/2, 0, -height/2 - distance]} />
<Circle x={0} y={-height/2 - distance} />

// Element content
// Positioned at (0, 0) or offset to match original layer positioning
```

## Benefits

### 1. Single Transformation Point
- All transformations (drag, rotate, resize) apply to the Group
- Selection UI and element(s) transform together automatically
- No coordinate system conversion needed

### 2. Unified State Management
- One position: `(centerX, centerY)`
- One rotation: `rotation`
- One scale: `{x: scaleX, y: scaleY}`
- Simplifies bounds calculation

### 3. Consistent Behavior
- Selection box always matches element bounds exactly
- No sync issues between UI and content
- Handles always positioned correctly relative to element

## Implementation Considerations

### Challenge: Layer Content Integration
**Current**: Each layer has its own Layer component with `layer.render()`
**Needed**: Clone or reference layer content into Group

**Options**:
1. **Clone approach**: Duplicate layer nodes into Group
   - Pros: Independent from original layer
   - Cons: Memory overhead, sync issues
   
2. **Reference approach**: Move layer nodes into Group temporarily
   - Pros: No duplication, true single object
   - Cons: Complex lifecycle management
   
3. **Hybrid approach**: Keep layers separate, use Group for selection UI only
   - Pros: Simpler implementation
   - Cons: Requires coordinate sync

### Recommended: Enhanced KonvaSelectionBox
Keep current layer structure but enhance KonvaSelectionBox to:
1. Position Group at layer content center (using selectedLayerBounds)
2. Render selection UI as children (already implemented)
3. Make Group draggable/transformable
4. Sync transformations back to layer controls

## Current Implementation Status

✅ **Completed**:
- Center-based Group positioning with offset
- Selection UI children positioned relative to center
- Coordinate system aligned with Transformer proxy

⏳ **In Progress**:
- Element content integration into Group

🔮 **Future**:
- Direct Group manipulation (drag, rotate, resize)
- Bypass Transformer for selection interactions
- Unified transformation state management

## References

- **KonvaSelectionBox**: `/ui/molecules/Selection/KonvaSelectionBox.tsx`
- **SimpleCanvas**: `/ui/molecules/Canvas/SimpleCanvas.tsx`
- **Konva Docs**: https://konvajs.org/docs/groups_and_layers/Groups.html
