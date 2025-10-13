# Development Guide - Simple Canvas

## 🚀 Getting Started with Development

### Quick Start

```bash
# Navigate to the project
cd /home/uat.marascott.ai/public_html/wp-content/plugins/marascott-genai/src_expo/tinyartist-editor/assets/fabric-editor/src

# Install dependencies (if needed)
npm install

# Start development server with live reload
npm run watch
```

The dev server will start at **http://localhost:3000** with automatic live reload!

## 📺 Live Reload

The watch mode includes a **built-in live reload server** that automatically refreshes your browser when you save changes.

### How It Works

1. **Start Watch Mode**
   ```bash
   npm run watch
   ```

2. **Open Browser**
   - Navigate to `http://localhost:3000`
   - The canvas will load automatically

3. **Edit Code**
   - Make changes to any `.tsx`, `.ts`, `.js`, or `.css` file
   - Save the file
   - Browser automatically reloads with your changes!

### Live Reload Features

- ✅ **Automatic Reload** - Browser refreshes on file save
- ✅ **Server-Sent Events** - Uses SSE for instant updates
- ✅ **Auto Reconnect** - Reconnects if connection drops
- ✅ **Heartbeat** - Keeps connection alive
- ✅ **Development Mode** - Sourcemaps enabled for debugging

### Live Reload Console

When connected, you'll see in the browser console:
```
[watch] Connected to live reload server.
```

When files change:
```
Rebuilt assets: editor.bundle.ABC123.js
```

## 🔧 Development Commands

### Build for Production
```bash
npm run build
```
- Minified bundle
- No sourcemaps
- Production optimizations
- Outputs to `dist/`

### Watch for Development
```bash
npm run watch
```
- Development server on port 3000
- Live reload enabled
- Sourcemaps for debugging
- Automatic rebuild on changes

### Custom Port
```bash
# Watch script uses port 3000 by default
# To change, edit scripts/watch.js and modify:
# const server = startDevServer({ port: 3000 });
```

## 🎯 Development Workflow

### 1. Start Watch Mode
```bash
npm run watch
```

Output:
```
Dev server running at http://localhost:3000
Open this URL in your browser to use the editor with live reload.

Generated asset manifest for editor.bundle.ABC123.js
Updated fallback asset editor.bundle.js
Updated index.html for editor.bundle.ABC123.js
Watching for changes... Latest assets: editor.bundle.ABC123.js
```

### 2. Open Browser
- Go to http://localhost:3000
- Canvas loads with example shapes
- Dev tools open (F12)

### 3. Make Changes

**Example: Change canvas background color**

Edit `ui/pages/Canvas/CanvasApp.tsx`:
```tsx
<CanvasContainer
  width={width}
  height={height}
  backgroundColor="#f0f0f0"  // Change from #ffffff to #f0f0f0
>
```

Save the file → Browser auto-reloads → See changes instantly!

### 4. Add New Components

**Example: Add a new shape**

Edit `ui/pages/Canvas/CanvasApp.tsx`:
```tsx
<CanvasContainer width={800} height={600}>
  <Rect x={50} y={50} width={100} height={100} fill="#4A90E2" />
  <Circle x={250} y={100} radius={50} fill="#E24A4A" />

  {/* Add a new star shape */}
  <Star
    x={400}
    y={100}
    numPoints={5}
    innerRadius={20}
    outerRadius={40}
    fill="#FFD700"
  />
</CanvasContainer>
```

Import at the top:
```tsx
import { Rect, Circle, Text, Star } from 'react-konva';
```

Save → Auto-reload → New star appears!

## 🐛 Debugging

### Source Maps
In watch mode, source maps are enabled:
- Set breakpoints in original TypeScript files
- Step through code in browser dev tools
- See original variable names

### Console Logging
```tsx
import { useEffect } from 'react';

export const CanvasApp = (props) => {
  useEffect(() => {
    console.log('Canvas mounted with props:', props);
  }, [props]);

  // ... component code
}
```

### React DevTools
- Install React DevTools browser extension
- Inspect component tree
- View props and state
- Profile performance

## 📁 File Watching

The watch system monitors these files:
- **TypeScript/TSX**: `*.ts`, `*.tsx`
- **JavaScript**: `*.js`, `*.jsx`
- **Styles**: `*.css`
- **Config**: `tsconfig.json`

Changes to these trigger automatic rebuild and reload.

### Files NOT Watched
- `node_modules/`
- `dist/`
- `*.md` documentation files
- Build scripts themselves

## 🔥 Hot Tips

### 1. Keep Dev Server Running
Leave `npm run watch` running while you code for the best experience.

### 2. Multiple Browser Windows
Open multiple browser windows to test different states simultaneously.

### 3. Network Tab
Use browser network tab to verify bundle loads correctly.

### 4. Preserve Log
Enable "Preserve log" in console to see logs across reloads.

### 5. Disable Cache
In dev tools, enable "Disable cache" to always get fresh builds.

## ⚡ Performance Tips

### Fast Rebuild Times
- Watch mode rebuilds in <100ms typically
- Only changed files are rebuilt
- esbuild is extremely fast

### Reduce Bundle Size
- Import only what you need from libraries
- Use code splitting for large features
- Check bundle size with production build

### Optimize Konva
- Use `listening: false` on static shapes
- Limit number of shapes in layer
- Use caching for complex paths

## 🚨 Troubleshooting

### Server Won't Start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in scripts/watch.js
```

### Live Reload Not Working
1. Check browser console for connection errors
2. Verify `/__livereload` endpoint is accessible
3. Check if firewall is blocking the connection
4. Restart watch server

### Build Errors
```bash
# Clear dist and rebuild
rm -rf dist
npm run watch
```

### TypeScript Errors
```bash
# Check TypeScript config
cat tsconfig.json

# Verify path aliases are correct
```

### Changes Not Appearing
1. Check console for build errors
2. Hard refresh: Ctrl+F5 (or Cmd+Shift+R on Mac)
3. Clear browser cache
4. Restart watch server

## 📚 Additional Resources

- [QUICK_START.md](QUICK_START.md) - Basic usage guide
- [ATOMIC_DESIGN.md](ATOMIC_DESIGN.md) - Architecture details
- [STRUCTURE.md](STRUCTURE.md) - Component hierarchy
- [Konva Docs](https://konvajs.org/) - Konva.js documentation
- [React-Konva Docs](https://konvajs.org/docs/react/) - React-Konva guide
- [esbuild Docs](https://esbuild.github.io/) - Build tool documentation

## 🎓 Next Steps

Now that you have live reload set up:

1. **Experiment** - Try modifying existing components
2. **Add Features** - Create new atoms, molecules, organisms
3. **Test** - Verify changes work across browsers
4. **Document** - Update docs as you add features
5. **Commit** - Save your work with descriptive commits

Happy coding! 🎨
