# Simple Canvas - Component Structure

## Visual Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                     📄 PAGE LEVEL                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ CanvasApp (ui/pages/Canvas/CanvasApp.tsx)            │  │
│  │ • Complete canvas application                         │  │
│  │ • Includes example shapes                             │  │
│  │ • Bootstrap configuration support                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ uses
┌─────────────────────────────────────────────────────────────┐
│                   📋 TEMPLATE LEVEL                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ CanvasLayout (ui/templates/Canvas/CanvasLayout.tsx)  │  │
│  │ • Overall page layout structure                       │  │
│  │ • Header, content, footer areas                       │  │
│  │ • Responsive container                                │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ uses
┌─────────────────────────────────────────────────────────────┐
│                   🧬 ORGANISM LEVEL                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ CanvasContainer (ui/organisms/Canvas/...)            │  │
│  │ • Full-featured canvas component                      │  │
│  │ • State management                                    │  │
│  │ • Stage lifecycle hooks                               │  │
│  │ • Event handling                                      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ uses
┌─────────────────────────────────────────────────────────────┐
│                   🧪 MOLECULE LEVEL                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ SimpleCanvas (ui/molecules/Canvas/SimpleCanvas.tsx)  │  │
│  │ • Combines Stage + Layer                              │  │
│  │ • Basic styling and centering                         │  │
│  │ • Stage reference management                          │  │
│  │ • onStageReady callback                               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ uses
┌─────────────────────────────────────────────────────────────┐
│                     ⚛️  ATOM LEVEL                           │
│  ┌─────────────────────────────┐  ┌──────────────────────┐  │
│  │ Stage                       │  │ Layer                │  │
│  │ (ui/atoms/Canvas/Stage.tsx) │  │ (ui/atoms/Canvas/    │  │
│  │ • Konva Stage wrapper       │  │  Layer.tsx)          │  │
│  │ • Root canvas container     │  │ • Konva Layer wrap   │  │
│  │ • Width/height props        │  │ • Element container  │  │
│  └─────────────────────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
index.tsx (Entry Point)
    │
    ├─── Reads: window.__EDITOR_BOOTSTRAP__
    │    • width, height, backgroundColor
    │
    └─── Renders: <CanvasApp />
            │
            └─── Provides props to child components
                    │
                    ├─── CanvasLayout (Template)
                    │    │
                    │    ├─── header: Title & description
                    │    ├─── children: Canvas content
                    │    └─── footer: Status text
                    │
                    └─── CanvasContainer (Organism)
                         │
                         ├─── Manages: stage state
                         ├─── Provides: onStageReady callback
                         │
                         └─── SimpleCanvas (Molecule)
                              │
                              ├─── Stage (Atom)
                              │    └─── Konva Stage wrapper
                              │
                              └─── Layer (Atom)
                                   └─── Konva Layer wrapper
                                        │
                                        └─── Children: React-Konva elements
                                             • <Rect />
                                             • <Circle />
                                             • <Text />
                                             • etc.
```

## File Organization

```
src/
├── index.tsx                           # 🚀 Entry point
├── index.template.html                 # 📝 HTML template
│
└── ui/                                 # All UI components
    │
    ├── atoms/                          # ⚛️  Basic building blocks
    │   └── Canvas/
    │       ├── Stage.tsx               # Konva Stage wrapper
    │       ├── Layer.tsx               # Konva Layer wrapper
    │       └── index.ts                # Export barrel
    │
    ├── molecules/                      # 🧪 Simple component combinations
    │   └── Canvas/
    │       ├── SimpleCanvas.tsx        # Stage + Layer combination
    │       └── index.ts                # Export barrel
    │
    ├── organisms/                      # 🧬 Complex feature components
    │   └── Canvas/
    │       ├── CanvasContainer.tsx     # Full-featured canvas
    │       └── index.ts                # Export barrel
    │
    ├── templates/                      # 📋 Page layout structures
    │   └── Canvas/
    │       ├── CanvasLayout.tsx        # Overall page layout
    │       └── index.ts                # Export barrel
    │
    └── pages/                          # 📄 Complete page implementations
        └── Canvas/
            ├── CanvasApp.tsx           # Main canvas application
            └── index.ts                # Export barrel
```

## Component Responsibilities

### ⚛️ Atoms (Primitives)
**Purpose**: Single-purpose, reusable building blocks
- `Stage`: Wraps Konva Stage with consistent API
- `Layer`: Wraps Konva Layer with consistent API

**Rules**:
- No business logic
- Minimal styling
- Pure props in/rendering out
- Fully reusable

### 🧪 Molecules (Compositions)
**Purpose**: Simple combinations of atoms
- `SimpleCanvas`: Combines Stage + Layer with basic functionality

**Rules**:
- Combine 2-3 atoms
- Simple, focused functionality
- Minimal state
- Still highly reusable

### 🧬 Organisms (Features)
**Purpose**: Complex, feature-rich components
- `CanvasContainer`: Full canvas with state management and hooks

**Rules**:
- Can manage state
- Implement business logic
- Provide callbacks/hooks
- Context-aware

### 📋 Templates (Layouts)
**Purpose**: Page-level layout structures
- `CanvasLayout`: Defines header/content/footer structure

**Rules**:
- Define layout structure
- Placeholder for content
- No specific data
- Reusable across pages

### 📄 Pages (Applications)
**Purpose**: Complete, specific implementations
- `CanvasApp`: The complete canvas application

**Rules**:
- Combine templates with real data
- Specific to one use case
- Can fetch data
- Entry point for features

## Benefits of This Structure

1. **Separation of Concerns**: Each level has a clear responsibility
2. **Reusability**: Lower-level components can be reused in multiple contexts
3. **Testability**: Small, focused components are easier to test
4. **Maintainability**: Clear hierarchy makes code easier to understand
5. **Scalability**: Easy to add new features by composing existing components
6. **Documentation**: Structure itself documents the architecture

## Adding New Features

To add a new feature, follow this pattern:

1. **Start with atoms** - Do you need new primitives?
2. **Create molecules** - Combine atoms into simple components
3. **Build organisms** - Add business logic and state
4. **Update templates** - Adjust layouts if needed
5. **Modify pages** - Integrate into the application

Example: Adding a drawing tool

```
1. Atom: DrawingLine (wraps Konva Line)
2. Molecule: DrawingCanvas (canvas that captures mouse events)
3. Organism: DrawingTool (complete drawing tool with state)
4. Template: (reuse CanvasLayout)
5. Page: DrawingApp (app with drawing tool)
```
