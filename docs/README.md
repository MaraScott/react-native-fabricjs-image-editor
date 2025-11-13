# Canvas Editor Documentation# Website



This directory contains the Docusaurus documentation site for the Canvas Editor project.This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.



## 🚀 Quick Start## Installation



### Install Dependencies```bash

yarn

```bash```

cd src/docs

npm install## Local Development

```

```bash

### Start Development Serveryarn start

```

```bash

npm startThis command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

```

## Build

The documentation will be available at `http://localhost:3001/docs/`

```bash

### Build for Productionyarn build

```

```bash

npm run buildThis command generates static content into the `build` directory and can be served using any static contents hosting service.

```

## Deployment

## 📁 Documentation Structure

Using SSH:

```

docs/```bash

├── intro.md                           # Home pageUSE_SSH=true yarn deploy

├── getting-started/```

│   └── quickstart.md                  # Quick start guide

├── architecture/Not using SSH:

│   └── atomic-design.md               # Atomic Design explanation

├── api/```bash

│   └── atoms.md                       # Atoms API referenceGIT_USER=<Your GitHub username> yarn deploy

└── contributing/```

    └── guidelines.md                  # Contributing guide

```If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.


## 🎨 Customization

Edit `docusaurus.config.ts` for site configuration and `src/css/custom.css` for styling.

## 📚 Resources

- [Docusaurus Documentation](https://docusaurus.io/)
- **Live Docs**: `http://localhost:3001/docs/`
- **GitHub**: https://github.com/MaraScott/www.marascott.ai
