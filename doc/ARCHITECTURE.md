# Architecture Overview

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                        EditorApp                            │
│                    (Orchestrator)                           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    HOOKS LAYER                       │  │
│  │              (Business Logic)                        │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │               PRESENTATION LAYER                     │  │
│  │                                                      │  │
│  │  ┌────────────────────┐  ┌──────────────────────┐  │  │
│  │  │   TAMAGUI UI       │  │   KONVA CANVAS       │  │  │
│  │  │  (Pure Display)    │  │  (Pure Rendering)    │  │  │
│  │  │                    │  │                      │  │  │
│  │  │                    │  │                      │  │  │
│  │  └────────────────────┘  └──────────────────────┘  │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────────┐
│    User      │
│   Action     │
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────────┐
│  Component Event Handler             │
│  (onClick, onDrag, etc.)             │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Hook Action                         │
│  (selectElement, setZoom, etc.)      │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  State Update                        │
│  (useState, useCallback)             │
└──────────────┬───────────────────────┘
               │
               ↓
┌──────────────────────────────────────┐
│  Component Re-render                 │
│  (with new props)                    │
└──────────────────────────────────────┘
```

## Separation of Concerns

### HOOKS (Logic Layer)
**Location**: 

**Responsibility**: 

**Characteristics**:

**Example**:
```tsx
```

### CANVAS (Konva Rendering Layer)
**Location**: 

**Responsibility**: 

**Characteristics**:

**Example**:
```tsx
```

### UI (Tamagui Display Layer)
**Location**: 

**Responsibility**: 

**Characteristics**:

**Example**:
```tsx
```
