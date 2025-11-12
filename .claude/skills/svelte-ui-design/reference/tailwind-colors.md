# Tailwind CSS 4 Color System

## Default Color Palette

Tailwind includes an extensive, expertly-crafted 11-step color palette out of the box.

### Color Scale

- **50**: Lightest shade
- **100-400**: Light shades
- **500**: Base/default shade
- **600-900**: Dark shades
- **950**: Darkest shade

### Available Colors

- Gray scale: `slate`, `gray`, `zinc`, `neutral`, `stone`
- Colors: `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`

## OKLCH Color Format

Tailwind v4 uses OKLCH color space for more vivid, modern colors with better contrast.

Example: `--color-blue-500: oklch(0.623 0.214 259.815)`

### Benefits

- Wider P3 gamut for richer hues
- More perceptually uniform
- Better for color manipulation
- Improved contrast ratios

## Using Colors

### Background Colors

```html
<div class="bg-white">White background</div>
<div class="bg-gray-950">Very dark gray</div>
<div class="bg-blue-500">Blue background</div>
```

### Text Colors

```html
<p class="text-gray-900">Dark text</p>
<p class="text-blue-600">Blue text</p>
<p class="text-red-500">Error text</p>
```

### Border Colors

```html
<div class="border border-gray-300">Light border</div>
<div class="border-2 border-blue-500">Blue border</div>
```

### Opacity Adjustment

```html
<div class="bg-sky-500/50">50% opacity</div>
<div class="text-red-600/75">75% opacity</div>
<div class="border-green-500/25">25% opacity</div>
```

## Custom Colors (CSS-First Configuration)

Add custom colors using the `@theme` directive:

```css
@theme {
	--color-midnight: #121063;
	--color-tahiti: #3ab7bf;
	--color-brand: oklch(0.84 0.18 117.33);
}
```

This automatically generates utilities:

```html
<div class="bg-midnight">Custom color</div>
<p class="text-tahiti">Custom text</p>
<div class="border-brand">Custom border</div>
```

## Redefining Default Colors

Replace existing colors with OKLCH values:

```css
@theme {
	--color-blue-500: oklch(0.7 0.2 250);
	--color-blue-600: oklch(0.6 0.2 250);
}
```

## Disabling Colors

Remove unused colors to reduce file size:

```css
@theme {
	--color-lime-*: initial;
	--color-orange-*: initial;
}
```

## Color Usage Patterns

### Status Colors

```html
<span class="text-green-600">✓ Success</span>
<span class="text-yellow-600">⚠ Warning</span>
<span class="text-red-600">✗ Error</span>
<span class="text-blue-600">ℹ Info</span>
```

### Semantic Naming

```css
@theme {
	--color-success: var(--color-green-500);
	--color-warning: var(--color-yellow-500);
	--color-error: var(--color-red-500);
	--color-info: var(--color-blue-500);
}
```

```html
<div class="bg-success">Success state</div>
<div class="bg-warning">Warning state</div>
```

### Dark Mode Colors

```html
<div
	class="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-white
">
	Automatic theme switching
</div>
```

### Hover States

```html
<button
	class="
  bg-blue-500
  hover:bg-blue-600
  active:bg-blue-700
">
	Interactive button
</button>
```

## Gradients

### Linear Gradients

```html
<div class="bg-gradient-to-r from-blue-500 to-purple-500">Two-color gradient</div>

<div class="bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500">Multi-stop gradient</div>
```

### Direction Options

- `bg-gradient-to-t`: Top
- `bg-gradient-to-tr`: Top right
- `bg-gradient-to-r`: Right
- `bg-gradient-to-br`: Bottom right
- `bg-gradient-to-b`: Bottom
- `bg-gradient-to-bl`: Bottom left
- `bg-gradient-to-l`: Left
- `bg-gradient-to-tl`: Top left

## Color Composition

### Layering with Opacity

```html
<div class="bg-blue-500/10">
	<div class="bg-blue-500/20">
		<div class="bg-blue-500/30">Progressively darker</div>
	</div>
</div>
```

### Ring Colors (Focus States)

```html
<input
	class="
  focus:ring-2
  focus:ring-blue-500
  focus:ring-offset-2
" />
```

### Divide Colors (Between Elements)

```html
<div class="divide-y divide-gray-200">
	<div>Item 1</div>
	<div>Item 2</div>
	<div>Item 3</div>
</div>
```

## Accessibility Considerations

### Contrast Ratios

Ensure sufficient contrast for WCAG compliance:

- **AA**: Minimum 4.5:1 for normal text
- **AAA**: Minimum 7:1 for normal text

### Recommended Pairings

```html
<!-- Good contrast -->
<div class="bg-gray-900 text-white">High contrast</div>
<div class="bg-white text-gray-900">High contrast</div>

<!-- Avoid -->
<div class="bg-gray-300 text-gray-400">Low contrast</div>
```

## Best Practices

1. **Use Semantic Colors**: Prefer meaningful color tokens over arbitrary shades
2. **Consistent Palette**: Stick to a limited color set for brand consistency
3. **Test Dark Mode**: Always test color combinations in both themes
4. **Consider Accessibility**: Maintain proper contrast ratios
5. **Use Opacity for Variations**: Instead of adding more colors, use opacity
6. **Leverage Hover/Active States**: Use darker shades for interactive feedback
