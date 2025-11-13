---
sidebar_position: 1
---

# Atoms API

Basic building blocks - the smallest UI components

## Components

- [RotateHandle](#rotatehandle)
- [ResizeHandle](#resizehandle)
- [Stage](#stage)
- [Layer](#layer)
- [Button](#button)

---

## RotateHandle

RotateHandle Atom - Visual handle for rotating selections
Typically positioned above the selection box

### Import

```tsx
import { RotateHandle } from '@Handle/RotateHandle';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `left` | `string | number` | `50%` |  |  |
| `top` | `string | number` | `-25px` |  |  |
| `onPointerDown` | `(event: PointerEvent<HTMLDivElement>) => void` | - |  |  |

### Example

```tsx
<RotateHandle />
```

---

## ResizeHandle

ResizeHandle Atom - Visual handle for resizing/transforming selections
Part of the selection transform UI

### Import

```tsx
import { ResizeHandle } from '@Handle/ResizeHandle';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `direction` | `string` | - | ✓ |  |
| `left` | `string | number` | `0` |  |  |
| `top` | `string | number` | `0` |  |  |
| `onPointerDown` | `(direction: string, event: PointerEvent<HTMLDivElement>) => void` | - |  |  |

### Example

```tsx
<ResizeHandle />
```

---

## Stage

Stage Atom - The most basic canvas container
Wraps Konva Stage with a consistent API

### Import

```tsx
import { Stage } from '@Canvas/Stage';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `width` | `number` | - | ✓ |  |
| `height` | `number` | - | ✓ |  |
| `style` | `CSSProperties` | - |  |  |

### Example

```tsx
<Stage />
```

---

## Layer

Layer Atom - Container for canvas elements
Wraps Konva Layer with a consistent API

### Import

```tsx
import { Layer } from '@Canvas/Layer';
```

### Example

```tsx
<Layer />
```

---

## Button

Button Atom - Reusable button component
Provides consistent styling and behavior across the application

### Import

```tsx
import { Button } from '@Button/Button';
```

### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `variant` | `enum` | `secondary` |  |  |
| `size` | `enum` | `medium` |  |  |
| `fullWidth` | `boolean` | `false` |  |  |
| `icon` | `ReactNode` | - |  |  |
| `disabled` | `boolean` | `false` |  |  |
| `style` | `CSSProperties` | - |  |  |
| `onClick` | `(event: MouseEvent<HTMLButtonElement, MouseEvent>) => void` | - |  |  |
| `onPointerDown` | `(event: PointerEvent<HTMLButtonElement>) => void` | - |  |  |
| `type` | `enum` | - |  |  |
| `aria-label` | `string` | - |  |  |
| `title` | `string` | - |  |  |

### Example

```tsx
<Button />
```

---
