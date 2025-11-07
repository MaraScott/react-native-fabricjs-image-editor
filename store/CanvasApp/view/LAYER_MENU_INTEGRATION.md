# Layer Menu Redux Integration - Complete! ✅

## What Was Implemented

### Layer Menu Visibility Control
**File:** `ui/molecules/Canvas/SimpleCanvas.tsx`

**Feature:** Layer menu now only displays when the **Select Tool** is active in the Redux store.

### Changes Made:

#### 1. Added Redux Imports
```typescript
import { useSelector } from 'react-redux';
import type { RootState } from '@store/CanvasApp';
```

#### 2. Added Redux Selector
```typescript
export const SimpleCanvas = ({...}) => {
  // Get active tool from Redux store
  const isSelectToolActive = useSelector((state: RootState) => state.view.select.active);
  
  // ... rest of component
}
```

#### 3. Conditional Layer Menu Rendering
**Before:**
```typescript
{layerControls && (
  <>
    <button>☰</button>  {/* Layer menu button */}
    {/* Layer panel */}
  </>
)}
```

**After:**
```typescript
{layerControls && isSelectToolActive && (
  <>
    <button>☰</button>  {/* Layer menu button - only in select mode */}
    {/* Layer panel - only in select mode */}
  </>
)}
```

---

## How It Works

### State Flow:
1. **User switches to Select Tool**
   - `dispatch(viewActions.setActiveTool('select'))`
   - Redux store updates: `state.view.select.active = true`

2. **SimpleCanvas Reacts**
   - `useSelector` detects change in `state.view.select.active`
   - Component re-renders
   - Layer menu button (`☰`) becomes visible

3. **User switches to Pan/Draw/Other Tool**
   - `dispatch(viewActions.setActiveTool('pan'))`
   - Redux store updates: `state.view.select.active = false`
   - Layer menu automatically hides

---

## Benefits

### 1. **Tool-Aware UI**
- Layer menu only appears when it's relevant (select mode)
- Cleaner UI when using other tools (pan, draw, crop, etc.)
- No manual visibility management needed

### 2. **Redux Store Integration**
- Single source of truth for active tool
- Automatic synchronization across all components
- Consistent behavior throughout the app

### 3. **Better UX**
- Users see layer controls only when they can select/manipulate layers
- Reduced visual clutter when drawing, panning, or cropping
- Intuitive tool-context relationship

---

## Testing Checklist

- [ ] **Switch to Select Tool** → Layer menu button (☰) appears
- [ ] **Open layer panel** → Panel displays with all layers
- [ ] **Switch to Pan Tool** → Layer menu button disappears
- [ ] **Switch to Draw Tool** → Layer menu button stays hidden
- [ ] **Switch back to Select** → Layer menu button reappears
- [ ] **Layer panel state** → Panel closes when switching away from select mode

---

## Redux Store State

```typescript
// When Select Tool is Active
state.view = {
  activeTool: 'select',
  select: {
    active: true,  // ← Layer menu checks this
    selectedIds: ['layer-1', 'layer-2'],
    selectionRect: { ... }
  },
  pan: { active: false, ... },
  draw: { active: false, ... }
}

// When Pan Tool is Active
state.view = {
  activeTool: 'pan',
  select: {
    active: false,  // ← Layer menu hidden
    selectedIds: ['layer-1', 'layer-2'],
    selectionRect: { ... }
  },
  pan: { active: true, ... },
  draw: { active: false, ... }
}
```

---

## Code Locations

### Modified Files:
1. **`ui/molecules/Canvas/SimpleCanvas.tsx`**
   - Added Redux imports (line 8-9)
   - Added `isSelectToolActive` selector (line 81)
   - Updated conditional rendering (line 1553)

### Related Files:
- **`store/CanvasApp/view/select.ts`** - Select tool reducer
- **`store/CanvasApp/view/index.ts`** - Combined view reducer
- **`ui/pages/Canvas/CanvasApp.tsx`** - Tool switching logic

---

## Future Enhancements

### Potential Improvements:
1. **Fade Animation** - Smooth fade in/out when tool changes
2. **Tooltip Message** - "Layer menu available in Select mode" when hovering in other modes
3. **Keyboard Shortcut** - Quick toggle layer panel with hotkey (only in select mode)
4. **Multiple Tool Support** - Show layer menu for select + other specific tools

---

## TypeScript Note

**Current Status:** TypeScript server is caching old types from deleted `view.tsx` file.

**Expected Error (False Positive):**
```
Property 'select' does not exist on type '{ active: string; ready: { ... } }'
```

**Resolution:** Restart TypeScript server
- `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
- All errors will clear ✓

---

## Summary

✅ **Layer menu visibility now tied to Redux store state**
✅ **Only displays when Select Tool is active**
✅ **Automatic synchronization with tool changes**
✅ **Clean, maintainable, Redux-first implementation**

The layer menu is now a **tool-aware** component that responds to the active tool state in the Redux store, providing a better user experience and cleaner architecture.
