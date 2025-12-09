---
sidebar_position: 3
---

# Organisms API

Complex UI components composed of molecules and atoms

## Components

- [SideBarLeft](#sidebarleft)
- [HeaderLeft](#headerleft)
- [Footer](#footer)
- [CanvasContainer](#canvascontainer)

---

## SideBarLeft

SideBarLeft Component

Renders the SideBarLeft component.

### Import

```tsx
import { SideBarLeft } from '@SideBar/SideBarLeft';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `key` | `string` | - |  |  |
| `isPanToolActive` | `boolean` | - | ✓ |  |
| `isSelectToolActive` | `boolean` | - | ✓ |  |
| `isDrawToolActive` | `boolean` | - | ✓ |  |
| `isRubberToolActive` | `boolean` | - | ✓ |  |
| `isTextToolActive` | `boolean` | - | ✓ |  |
| `isPaintToolActive` | `boolean` | - | ✓ |  |

### Example

```tsx
<SideBarLeft />
```

---

## HeaderLeft

### Import

```tsx
import { HeaderLeft } from '@Header/HeaderLeft';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `key` | `string` | - |  |  |
| `width` | `number` | - | ✓ |  |
| `height` | `number` | - | ✓ |  |
| `theme` | `enum` | - | ✓ |  |
| `language` | `i18n.Language` | - | ✓ |  |
| `onThemeChange` | `(theme: "kid" | "adult") => void` | - |  |  |
| `onLanguageChange` | `(lang: i18n.Language) => void` | - |  |  |

### Example

```tsx
<HeaderLeft />
```

---

## Footer

### Import

```tsx
import { Footer } from '@Footer/Footer';
```

### Example

```tsx
<Footer />
```

---

## CanvasContainer

CanvasContainer Component

Renders the CanvasContainer component.

### Import

```tsx
import { CanvasContainer } from '@Canvas/CanvasContainer';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `key` | `string` | - |  |  |
| `width` | `number` | `1024` |  |  |
| `height` | `number` | `1024` |  |  |
| `backgroundColor` | `string` | `#cccccc33` |  |  |
| `containerBackground` | `string` | `#cccccc` |  |  |
| `zoom` | `number` | `0` |  |  |
| `fitRequest` | `number` | `0` |  |  |
| `onStageReady` | `(stage: Konva.Stage) => void` | - |  |  |
| `onZoomChange` | `(zoom: number) => void` | - |  |  |
| `onHistoryChange` | `(handlers: { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean; revision: number; }) => void` | - |  |  |
| `panModeActive` | `boolean` | `false` |  |  |
| `initialLayers` | `InitialLayerDefinition[]` | - |  |  |
| `selectModeActive` | `boolean` | `false` |  |  |
| `language` | `Language` | `en` |  |  |

### Example

```tsx
<CanvasContainer />
```

---
