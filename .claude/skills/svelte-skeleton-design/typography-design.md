# Typography

Skeleton provides opt-in utility classes for styling semantic HTML elements and a customizable typographic scale.

## Native Element Styles

### Headings

Classes `.h1` through `.h6` style heading elements with theme-defined fonts and colors.

### Paragraphs

Standard paragraph styling using native `<p>` elements.

### Blockquotes

The blockquote class styles quoted text with semantic HTML support.

### Additional Elements

- **Anchor**: `.anchor` class for styled links
- **Pre-Formatted**: `.pre` class for code blocks
- **Code**: `.code` class for inline code snippets
- **Keyboard**: `.kbd` class for key combinations
- **Insert/Delete**: `.ins` and `.del` classes for content modifications
- **Mark**: `.mark` class for highlighted text

### Lists

Skeleton defers to Tailwind utilities for list styling, supporting:

- Basic lists (`.list-none`)
- Unordered lists (`.list-disc`)
- Ordered lists (`.list-decimal`)
- Description lists (`<dl>`, `<dt>`, `<dd>`)
- Navigation lists

## Advanced Features

### Typographic Scale

By modifying your theme's `--text-scaling` property, you can control the overall scale of text sizing globally across the application. The base scale is `1.0` for 100%.

### Semantic Typography

Skeleton offers preset classes for designer-crafted typography systems:

| Class                   | Use Case              |
| ----------------------- | --------------------- |
| `preset-typo-display-4` | Large display text    |
| `preset-typo-headline`  | Main headlines        |
| `preset-typo-body-1/2`  | Body content          |
| `preset-typo-caption`   | Small supporting text |
| `preset-typo-button`    | Button labels         |

## Resources

- [Source Code](https://github.com/skeletonlabs/skeleton/blob/main/packages/skeleton/src/utilities/typography.css)
- [Core API Documentation](/docs/svelte/design/typography)
