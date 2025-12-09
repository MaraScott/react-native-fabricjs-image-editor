---
sidebar_position: 4
---

# Templates API

Page-level layouts that place components into structure

## Components

- [CanvasLayout](#canvaslayout)

---

## CanvasLayout

Header has three zones: left, center (for zoom controls), and right

### Import

```tsx
import { CanvasLayout } from '@Canvas/CanvasLayout';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `classNameId` | `string` | `canvas-layout` |  |  |
| `headerLeft` | `ReactNode` | - |  |  |
| `headerCenter` | `ReactNode` | - |  |  |
| `headerRight` | `ReactNode` | - |  |  |
| `sidebarLeft` | `ReactNode` | - |  |  |
| `footer` | `ReactNode` | - |  |  |

### Example

```tsx
<CanvasLayout />
```

---
