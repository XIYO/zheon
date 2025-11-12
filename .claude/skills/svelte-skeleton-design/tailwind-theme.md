# Tailwind CSS 4 Theme Configuration

## CSS-First Configuration

Tailwind v4 shifts from JavaScript (`tailwind.config.js`) to CSS-based configuration using the `@theme` directive.

## Basic Setup

```css
@import 'tailwindcss';

@theme {
	/* Your theme customizations */
}
```

## @theme Directive

The `@theme` directive defines design tokens that automatically generate utility classes.

### Key Difference from CSS Variables

- **`:root` variables**: Only store values
- **`@theme` variables**: Store values AND generate utility classes

Example:

```css
@theme {
	--color-mint-500: oklch(0.72 0.11 178);
}
```

This creates: `bg-mint-500`, `text-mint-500`, `border-mint-500`, etc.

## Theme Variable Namespaces

Variable prefix determines which utilities are generated:

### Colors (`--color-*`)

```css
@theme {
	--color-brand: #316ff6;
	--color-accent: oklch(0.84 0.18 117.33);
}
```

Generates: `bg-brand`, `text-brand`, `border-brand`, `bg-accent`, etc.

### Fonts (`--font-*`)

```css
@theme {
	--font-display: 'Satoshi', 'sans-serif';
	--font-body: 'Inter', sans-serif;
}
```

Generates: `font-display`, `font-body`

### Spacing (`--spacing-*`)

```css
@theme {
	--spacing-xs: 0.5rem;
	--spacing-xl: 2rem;
}
```

Generates: `p-xs`, `m-xl`, `gap-xs`, etc.

### Breakpoints (`--breakpoint-*`)

```css
@theme {
	--breakpoint-tablet: 768px;
	--breakpoint-desktop: 1024px;
}
```

Generates: `tablet:`, `desktop:` variants

### Shadows (`--shadow-*`)

```css
@theme {
	--shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.1);
	--shadow-hard: 0 4px 16px rgba(0, 0, 0, 0.2);
}
```

Generates: `shadow-soft`, `shadow-hard`

### Border Radius (`--radius-*`)

```css
@theme {
	--radius-sm: 0.25rem;
	--radius-lg: 1rem;
}
```

Generates: `rounded-sm`, `rounded-lg`

## Complete Theme Example

```css
@import 'tailwindcss';

@theme {
	/* Brand Colors */
	--color-primary: oklch(0.55 0.22 260);
	--color-secondary: oklch(0.75 0.15 180);
	--color-accent: oklch(0.65 0.25 30);

	/* Semantic Colors */
	--color-success: oklch(0.65 0.18 145);
	--color-warning: oklch(0.75 0.15 85);
	--color-error: oklch(0.55 0.22 25);

	/* Typography */
	--font-display: 'Montserrat', sans-serif;
	--font-body: 'Inter', sans-serif;
	--font-mono: 'Fira Code', monospace;

	/* Spacing Scale */
	--spacing-xs: 0.25rem;
	--spacing-sm: 0.5rem;
	--spacing-md: 1rem;
	--spacing-lg: 1.5rem;
	--spacing-xl: 2rem;
	--spacing-2xl: 3rem;

	/* Shadows */
	--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
	--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
	--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

	/* Border Radius */
	--radius-sm: 0.25rem;
	--radius-md: 0.5rem;
	--radius-lg: 1rem;
	--radius-full: 9999px;

	/* Breakpoints */
	--breakpoint-tablet: 768px;
	--breakpoint-desktop: 1024px;
	--breakpoint-wide: 1280px;
}
```

## Referencing Theme Variables

Theme variables compile to CSS variables accessible in custom CSS:

```css
.custom-component {
	background: var(--color-primary);
	font-family: var(--font-display);
	padding: var(--spacing-lg);
}
```

## Inline Styles

Can also use in inline styles:

```html
<div style="color: var(--color-primary)">Custom styled element</div>
```

## Overriding Default Theme

### Extending

Add new values without removing defaults:

```css
@theme {
	--color-brand: #316ff6;
}
```

### Replacing

Replace specific default values:

```css
@theme {
	--color-blue-500: oklch(0.7 0.2 250);
}
```

### Removing

Disable unused colors:

```css
@theme {
	--color-lime-*: initial;
	--color-orange-*: initial;
}
```

## Dynamic Theming

Can use CSS variables for runtime theme switching:

```css
:root {
	--theme-primary: var(--color-blue-500);
}

[data-theme='dark'] {
	--theme-primary: var(--color-blue-400);
}

@theme {
	--color-theme: var(--theme-primary);
}
```

## Migration from v3

### Before (tailwind.config.js)

```js
module.exports = {
	theme: {
		extend: {
			colors: {
				brand: '#316ff6'
			},
			fontFamily: {
				display: ['Satoshi', 'sans-serif']
			}
		}
	}
};
```

### After (CSS)

```css
@theme {
	--color-brand: #316ff6;
	--font-display: 'Satoshi', 'sans-serif';
}
```

## Best Practices

1. **Semantic Naming**: Use descriptive names (`--color-brand` not `--color-blue-custom`)
2. **Consistent Scale**: Maintain predictable sizing scales
3. **OKLCH for Colors**: Use OKLCH for better color manipulation
4. **Group Related Values**: Organize theme variables by category
5. **Document Custom Values**: Add comments for custom theme tokens
6. **Test with Dark Mode**: Ensure theme works in both light and dark modes

## Performance Benefits

- **Faster Builds**: CSS parsing is faster than JavaScript
- **Smaller Config**: No JavaScript overhead
- **Better Caching**: CSS files cache better than JS config
- **Incremental Builds**: Only changed CSS needs recompilation
