---
sidebar_position: 5
---

# Pages API

Specific instances of templates with real content

## Components

- [CanvasApp](#canvasapp)

---

## CanvasApp

CanvasApp Page - The complete canvas application
Demonstrates a simple canvas with basic shapes and zoom controls
Default size is 1024x1024 that fits container via zoom

### Import

```tsx
import { CanvasApp } from '@Canvas/CanvasApp';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `id` | `string` | `tiny-artist-editor` |  |  |
| `width` | `number` | - |  |  |
| `height` | `number` | - |  |  |
| `backgroundColor` | `string` | - |  |  |
| `containerBackground` | `string` | `#cccccc` |  |  |
| `theme` | `enum` | - |  |  |
| `i18n` | `string` | - |  |  |
| `assets_path` | `string` | - |  |  |
| `initialZoom` | `number` | `0` |  |  |

### Example

```tsx
<CanvasApp />
```

---
