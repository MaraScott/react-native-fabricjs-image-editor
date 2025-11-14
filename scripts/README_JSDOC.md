# JSDoc Documentation Generator

This script automatically generates and improves JSDoc comments throughout the codebase.

## Features

- 🔍 **Intelligent Analysis**: Parses TypeScript/JavaScript files using the TypeScript compiler API
- 🎯 **Targeted Documentation**: Focuses on exported functions, classes, interfaces, React components, and hooks
- 🧹 **Cleanup**: Replaces auto-generated placeholder comments with meaningful documentation
- 💾 **Safe**: Dry-run mode to preview changes before applying
- 🎨 **Context-Aware**: Generates appropriate docs based on code structure (components, hooks, functions, etc.)

## Usage

### Quick Start

```bash
# Preview what would be documented (dry-run)
npm run docs:generate:dry-run

# Generate documentation for all files
npm run docs:generate

# Document specific paths
npm run docs:generate:ui        # Only UI components
npm run docs:generate:store     # Only Redux store
```

### Advanced Usage

```bash
# Document a specific file or directory
node scripts/generateJSDoc.js --path ui/atoms/Button

# Preview changes without modifying files
node scripts/generateJSDoc.js --dry-run

# Force overwrite all documentation (even good ones)
node scripts/generateJSDoc.js --force

# Exclude specific paths
node scripts/generateJSDoc.js --exclude tests --exclude __mocks__

# Combine options
node scripts/generateJSDoc.js --path ui --exclude ui/pages --dry-run
```

## What Gets Documented

The script identifies and documents:

### ✅ Functions & Methods
```typescript
/**
 * calculateTotal
 * 
 * Function to calculate total.
 * 
 * @param {number} price - Parameter description
 * @param {number} quantity - Parameter description
 * @returns {number} Return value description
 */
function calculateTotal(price: number, quantity: number): number {
  return price * quantity;
}
```

### ✅ React Components
```typescript
/**
 * Button Component
 * 
 * Renders the Button component.
 * 
 * @param {ButtonProps} props - Parameter description
 * @returns {JSX.Element} Return value description
 */
export const Button = (props: ButtonProps): JSX.Element => {
  // ...
}
```

### ✅ React Hooks
```typescript
/**
 * useLocalStorage Hook
 * 
 * Custom hook for local storage.
 * 
 * @param {string} key - Parameter description
 * @param {any} initialValue - Parameter description
 * @returns {[any, Function]} Return value description
 */
export const useLocalStorage = (key: string, initialValue: any) => {
  // ...
}
```

### ✅ Interfaces & Types
```typescript
/**
 * User Interface
 * 
 * Type definition for User.
 */
export interface User {
  id: string;
  name: string;
  email: string;
}
```

### ✅ Classes
```typescript
/**
 * EventEmitter Class
 * 
 * EventEmitter class implementation.
 */
export class EventEmitter {
  // ...
}
```

## What Gets Replaced

The script identifies and replaces placeholder documentation:

❌ **Auto-generated placeholders**:
```typescript
/**
 * calculateTotal - Auto-generated summary; refine if additional context is needed.
 * @returns {number} Refer to the implementation for the precise returned value.
 */
```

✅ **Improved documentation**:
```typescript
/**
 * calculateTotal
 * 
 * Function to calculate total.
 * 
 * @param {number} price - Parameter description
 * @param {number} quantity - Parameter description
 * @returns {number} Return value description
 */
```

## Configuration

Edit `scripts/generateJSDoc.js` to customize:

```javascript
const config = {
  targetPaths: ['ui', 'store', 'utils', 'shims'],  // Directories to process
  excludePaths: ['docs', 'scripts', 'node_modules'],  // Directories to skip
  fileExtensions: ['.ts', '.tsx', '.js', '.jsx'],  // File types to process
  placeholderPatterns: [  // Patterns that identify placeholder docs
    /Auto-generated (summary|documentation stub)/i,
    /Refer to the implementation for/i,
    /Parameter (derived from|forwarded to)/i,
    /Result produced by/i,
  ],
};
```

## Best Practices

1. **Always dry-run first**: Use `--dry-run` to preview changes
2. **Review generated docs**: The script generates basic documentation; review and enhance as needed
3. **Run incrementally**: Document one module at a time for easier review
4. **Commit before running**: Make sure you can revert if needed
5. **Manual refinement**: Use generated docs as a starting point, then add specifics

## Example Workflow

```bash
# 1. See what needs documentation
npm run docs:generate:dry-run

# 2. Document UI components
npm run docs:generate:ui

# 3. Review changes
git diff

# 4. If good, commit
git add ui/
git commit -m "docs: improve JSDoc for UI components"

# 5. Repeat for other modules
npm run docs:generate:store
```

## Output Example

```
🚀 JSDoc Documentation Generator

📝 Processing: ui/atoms/Button/Button.tsx
   ✅ Updated
📝 Processing: ui/molecules/Canvas/SimpleCanvas.tsx
   ✅ Updated
📝 Processing: store/CanvasApp/view/select.ts
   ✅ Updated

📊 Summary:
   Files processed: 48
   Files modified: 23
   Comments added: 87
   Comments improved: 156
```

## Troubleshooting

### Script doesn't find files
- Check that paths are relative to `src/` directory
- Verify file extensions match configuration
- Ensure files aren't in excluded paths

### Documentation not improved
- Check if existing documentation matches placeholder patterns
- Use `--force` to overwrite all documentation
- Verify the file parses correctly (no syntax errors)

### Generated docs are generic
- This is expected! The script generates basic documentation
- Manual refinement is required for detailed, context-specific docs
- Use generated docs as a foundation to build upon

## Future Enhancements

Potential improvements:
- AI-powered description generation
- Integration with existing documentation
- Custom templates per project
- Support for more JSDoc tags (@example, @see, @deprecated)
- Validation of existing documentation
- Integration with CI/CD

## Related Scripts

- `add-jsdoc-comments.js` - Original JSDoc addition script
- `index-code-jsdoc.js` - Code indexing script
- `buildShared.js` - Build configuration with documentation support

## Support

For issues or suggestions, please refer to the main project documentation or create an issue in the repository.
