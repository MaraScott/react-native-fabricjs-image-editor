---
sidebar_position: 1
---

# Contributing Guidelines

Thank you for your interest in contributing to Canvas Editor! This guide will help you get started.

## Code of Conduct

Be respectful, inclusive, and collaborative. We're building something amazing together! 🚀

## Getting Started

### 1. Fork and Clone

```bash
git clone https://github.com/YourUsername/www.marascott.ai.git
cd www.marascott.ai/wp-content/plugins/marascott-genai/src_expo/tinyartist-editor/assets/fabric-editor
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

## Development Workflow

### Running the Dev Server

```bash
npm run watch
```

Open `index.html` in your browser to see changes in real-time.

### Building

```bash
npm run build
```

## Contributing New Features

### Follow Atomic Design

Always follow the atomic design hierarchy:

1. **Start with Atoms** (if needed)
2. **Compose into Molecules**
3. **Build Organisms**
4. **Create Templates**
5. **Implement Pages**

### Example: Adding a New Button Variant

```tsx
// 1. Update Button atom
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

const getVariantStyles = (variant: ButtonVariant) => {
  // Add success variant
  const styles = {
    // ... existing variants
    success: {
      backgroundColor: '#2d7a2d',
      color: '#ffffff',
      border: '1px solid #2d7a2d',
    },
  };
  return styles[variant];
};

// 2. Use it
<Button variant="success">Save</Button>
```

## Code Style

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type

```tsx
// Good
interface ButtonProps {
  variant: ButtonVariant;
  onClick: () => void;
}

// Bad
const Button = (props: any) => { /* ... */ };
```

### Naming Conventions

- **Components**: PascalCase (`Button`, `SelectionBox`)
- **Functions**: camelCase (`handleClick`, `computeBounds`)
- **Constants**: UPPER_SNAKE_CASE (`MIN_ZOOM`, `MAX_ZOOM`)
- **Files**: Match component name (`Button.tsx`, `SelectionBox.tsx`)

### File Structure

```tsx
/**
 * Component description
 */

// Imports
import { useState } from 'react';
import type { ReactNode } from 'react';

// Types
export interface MyComponentProps {
  // ...
}

// Component
export const MyComponent = ({ prop1, prop2 }: MyComponentProps) => {
  // Implementation
};

// Display name
MyComponent.displayName = 'MyComponent';
```

## Testing

### Unit Tests

Test utility functions:

```tsx
import { computeNodeBounds } from '@utils/canvas';

describe('computeNodeBounds', () => {
  it('returns correct bounds', () => {
    const mockNode = createMockNode();
    const bounds = computeNodeBounds(mockNode);
    expect(bounds).toEqual({ x: 0, y: 0, width: 100, height: 100 });
  });
});
```

### Component Tests

Test atoms in isolation:

```tsx
import { render, fireEvent } from '@testing-library/react';
import { Button } from '@atoms/Button';

describe('Button', () => {
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    const { getByText } = render(
      <Button onClick={handleClick}>Click</Button>
    );
    
    fireEvent.click(getByText('Click'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## Documentation

### Update Documentation

When adding features, update the docs:

1. **API Documentation**: Add to relevant API pages
2. **Examples**: Create usage examples
3. **README**: Update if changing core functionality

### JSDoc Comments

Add JSDoc comments to all exported functions:

```tsx
/**
 * Calculate the bounding box of a Konva node
 * @param node - The Konva node to measure
 * @returns Bounding box with x, y, width, height or null if invalid
 */
export const computeNodeBounds = (node: Konva.Node): Bounds | null => {
  // Implementation
};
```

## Pull Request Process

### 1. Prepare Your PR

- **Test your changes** thoroughly
- **Update documentation** as needed
- **Follow code style** guidelines
- **Write clear commit messages**

### 2. Commit Messages

Use conventional commits:

```bash
feat: add success variant to Button atom
fix: resolve selection box rotation issue
docs: update Atoms API documentation
refactor: extract zoom logic to custom hook
```

### 3. Create Pull Request

- **Title**: Clear, descriptive title
- **Description**: Explain what and why
- **Screenshots**: Include if UI changes
- **Testing**: Describe how you tested

Example PR description:

```markdown
## Description
Adds a new "success" variant to the Button atom for positive actions.

## Changes
- Added `success` variant type
- Updated `getVariantStyles()` function
- Added examples to documentation

## Testing
- Tested all button variants
- Verified styling consistency
- Updated unit tests

## Screenshots
[Include screenshot of new button variant]
```

### 4. Code Review

- Be open to feedback
- Respond to comments promptly
- Make requested changes
- Keep discussions constructive

## Areas for Contribution

### High Priority

- **Custom Hooks**: Extract logic from SimpleCanvas
- **Layer Panel**: Build dedicated LayerPanel molecule
- **Tests**: Add unit and integration tests
- **Performance**: Optimize rendering and state management

### Good First Issues

- **Documentation**: Improve examples and guides
- **Bug Fixes**: Fix reported issues
- **Styling**: Improve UI/UX consistency
- **Accessibility**: Enhance keyboard and screen reader support

### Ideas Welcome

- **New Tools**: Drawing tools, text tool, shape tools
- **Export**: Save canvas as PNG, JPG, SVG
- **Import**: Load images and designs
- **Collaboration**: Real-time multi-user editing

## Questions?

- **GitHub Issues**: Report bugs and ask questions
- **Discussions**: Start conversations about features
- **Documentation**: Check the docs first

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing! 🎉
