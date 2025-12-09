# Konva Image Editor

This directory contains the simple Konva-based image editor that powers the editing experience. The package is focused on bundling the editor assets (canvas interactions, controls, and styles) that live inside the Fabric Editor.

<img width="1431" height="653" alt="image" src="https://github.com/user-attachments/assets/e39b2174-6e35-4134-98e3-a508317af852" />

## Prerequisites

- Node.js (v16+ tested, but later LTS versions are recommended)
- npm (comes with Node.js)

## Installation

1. Open a terminal in this directory.
2. Run `npm install` to download dependencies (`esbuild` for bundling and `sass` for styles).

## Available Scripts

All scripts are executed with `npm run <script>`.

- `build` — bundles the editor assets for production using the custom `scripts/build.js`.
- `watch` — runs the watcher (`scripts/watch.js`) to rebuild incrementally during development.
- `add-jsdoc` — inserts JSDoc comments where they are missing to keep documentation annotations up to date.
- `index-code` — indexes the codebase based on existing JSDoc comments for reference tooling.
- `docs:generate` — generates the full set of documentation from the annotated source files.
- `docs:generate:dry-run` — previews the documentation changes without modifying any files.
- `docs:generate:ui` and `docs:generate:store` — create documentation for specific `ui` or `store` areas if those paths exist in the codebase.

## Working with the Editor

1. Use `npm run watch` while editing source files so changes are automatically bundled.
2. Run `npm run build` once you are ready to bundle for deployment.
3. If you need to refresh documentation, use the `docs:generate*` scripts; they rely on JSDoc annotations, so keep the comments current.
