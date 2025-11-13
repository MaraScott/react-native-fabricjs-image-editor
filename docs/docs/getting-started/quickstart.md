# Quick Start Guide - Simple Canvas

## 🎯 What is This?

A clean, simple canvas implementation using **Konva.js** and the **Atomic Design Pattern** for React/React Native applications.

## 🚀 Getting Started

### 1. Build the Project
```bash
cd /path/to/fabric-editor/src
npm run build
```

### 2. Open in Browser
Open `index.html` in your browser to see the canvas with example shapes.

### 3. Development Mode
```bash
npm run watch
```
Changes will auto-rebuild (refresh browser manually).

## 📝 Basic Usage

### Use the Complete App
```tsx
import { CanvasApp } from '@pages/Canvas';

<CanvasApp width={800} height={600} backgroundColor="#ffffff" />
```

### Build Custom Canvas
```tsx
import { CanvasContainer } from '@organisms/Canvas';
import { Rect, Circle, Text } from 'react-konva';

function MyCanvas() {
  return (
    <CanvasContainer width={1024} height={768}>
      <Rect x={100} y={100} width={200} height={150} fill="blue" />
      <Circle x={400} y={200} radius={75} fill="red" />
      <Text x={100} y={300} text="Hello Canvas!" fontSize={32} />
    </CanvasContainer>
  );
}
```

### Use Just the Canvas Molecule
```tsx
import { SimpleCanvas } from '@molecules/Canvas';
import { Star } from 'react-konva';

function SimpleExample() {
  return (
    <SimpleCanvas width={600} height={400}>
      <Star
        x={300}
        y={200}
        numPoints={5}
        innerRadius={50}
        outerRadius={100}
        fill="yellow"
        stroke="black"
      />
    </SimpleCanvas>
  );
}
```

## 🎨 Adding Shapes

All [Konva shapes](https://konvajs.org/docs/shapes/Rect.html) work with React-Konva:

```tsx
import { Rect, Circle, Ellipse, Line, Text, Image } from 'react-konva';

<CanvasContainer width={800} height={600}>
  {/* Rectangle */}
  <Rect x={50} y={50} width={100} height={80} fill="green" />

  {/* Circle */}
  <Circle x={250} y={90} radius={40} fill="purple" />

  {/* Line */}
  <Line points={[0, 100, 200, 100]} stroke="black" strokeWidth={2} />

  {/* Text */}
  <Text x={50} y={200} text="Canvas!" fontSize={24} fill="black" />
</CanvasContainer>
```

## 🔧 Configuration

### Via Bootstrap Object (Recommended)
```html
<script>
  window.__EDITOR_BOOTSTRAP__ = {
    width: 1024,
    height: 768,
    backgroundColor: '#f5f5f5'
  };
</script>
```

### Via Props
```tsx
<CanvasApp
  width={1024}
  height={768}
  backgroundColor="#f5f5f5"
/>
```

## 📦 Component Levels

Choose the right level for your needs:

| Level | Component | Use When |
|-------|-----------|----------|
| **Atom** | `Stage`, `Layer` | Building custom canvas from scratch |
| **Molecule** | `SimpleCanvas` | Need basic canvas with styling |
| **Organism** | `CanvasContainer` | Need state management & hooks |
| **Template** | `CanvasLayout` | Need page layout structure |
| **Page** | `CanvasApp` | Need complete application |

## 🎯 Common Tasks

### Add Interactivity
```tsx
import { Rect } from 'react-konva';
import { useState } from 'react';

function InteractiveRect() {
  const [color, setColor] = useState('blue');

  return (
    <Rect
      x={100}
      y={100}
      width={100}
      height={100}
      fill={color}
      onClick={() => setColor('red')}
      onMouseEnter={(e) => {
        e.target.getStage().container().style.cursor = 'pointer';
      }}
      onMouseLeave={(e) => {
        e.target.getStage().container().style.cursor = 'default';
      }}
    />
  );
}
```

### Access Stage Instance
```tsx
import { CanvasContainer } from '@organisms/Canvas';

function MyCanvas() {
  const handleStageReady = (stage) => {
    console.log('Stage ready:', stage);
    // Do something with stage
    stage.on('click', () => console.log('Canvas clicked!'));
  };

  return (
    <SimpleCanvas
      width={800}
      height={600}
      onStageReady={handleStageReady}
    >
      {/* shapes */}
    </SimpleCanvas>
  );
}
```

### Export Canvas as Image
```tsx
function ExportExample() {
  const stageRef = useRef(null);

  const handleExport = () => {
    if (stageRef.current) {
      const uri = stageRef.current.toDataURL();
      // Download or use the image
      const link = document.createElement('a');
      link.download = 'canvas.png';
      link.href = uri;
      link.click();
    }
  };

  return (
    <>
      <button onClick={handleExport}>Export PNG</button>
      <Stage ref={stageRef} width={800} height={600}>
        <Layer>
          {/* shapes */}
        </Layer>
      </Stage>
    </>
  );
}
```

## 📚 More Information

- [Atomic Design](../architecture/atomic-design) - Detailed architecture guide
- [Structure Guide](../architecture/structure) - Visual component hierarchy
- [Konva Docs](https://konvajs.org/) - Konva.js documentation
- [React-Konva Docs](https://konvajs.org/docs/react/) - React-Konva guide

## 🔄 Restore Original Editor

```bash
mv index.tsx index-simple.tsx
mv index.tsx.backup index.tsx
npm run build
```

## 💡 Tips

1. **Start Simple**: Use `CanvasApp` and modify from there
2. **Compose Up**: Build complex UIs from simple atoms
3. **Ref for Control**: Use refs when you need direct stage access
4. **Events Work**: All Konva events work with React-Konva
5. **Performance**: Keep render optimized, use `shouldComponentUpdate` for heavy scenes

## 🐛 Common Issues

**Canvas not showing?**
- Check browser console for errors
- Verify vendor scripts loaded (React, ReactDOM, Konva)
- Ensure container div exists (`image-editor-root`)

**Shapes not appearing?**
- Verify shapes are inside `<Layer>` component
- Check x, y coordinates are within canvas bounds
- Ensure fill/stroke colors are set

**Build fails?**
- Run `npm install` to ensure dependencies
- Check TypeScript paths in `tsconfig.json`
- Verify all imports use correct path aliases

## 🎓 Next Steps

Ready to add features? Check out:
- [Adding Drawing Tools](#)
- [Implementing Selection](#)
- [Layer Management](#)
- [History/Undo](#)
- [Image Import/Export](#)

Happy coding! 🎨
