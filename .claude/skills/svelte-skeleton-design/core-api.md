# Core API

The heart of Skeleton is our framework agnostic core package. This adapts and extends Tailwind to introduce our global styles, color system, typography, and more.

## @base Layer

Extends Tailwind's base with opinionated global styles including:

- Root color scheme matching dark mode settings
- Custom scrollbar styling with theme colors
- Global text selection colors
- Body background and font defaults
- Global disabled state styling

## @theme Properties

### Colors

Skeleton extends the color palette with theme-specific utilities:

- `[property]-[color]-[shade]` maps to `--color-[color]-[shade]`
- Contrast color variants available
- Body background colors for light/dark modes

### Color Pairings

Implements balanced color solutions between light and dark modes using format:

```
[property]-[color]-[shade]-[shade]
```

### Spacing

Integrates Tailwind spacing with dynamic scaling via `--spacing` variable

### Typography

Implements typographic scaling across font sizes using the formula:

```
--text-{size}: calc({remSize} * var(--text-scaling))
```

Includes configurable styles for:

- **Base text**: color, family, size, weight, line-height
- **Headings**: similar properties
- **Anchor links**: includes decoration states

### Radius & Edges

- `rounded-base` and `rounded-container` for consistent border radius
- Default border, ring, and divide widths via theme properties

## @utility & @variant

- Tailwind Components for semantic HTML styling
- Theme variants enable targeted styling: `theme-cerberus:`, `theme-mona:`, etc.

## Optional Features

- **Presets**: Pre-styled component sets
- **Preset Themes**: Curated theme collection

[View on GitHub](https://github.com/skeletonlabs/skeleton)
