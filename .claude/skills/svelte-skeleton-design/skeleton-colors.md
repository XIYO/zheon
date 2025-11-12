# Skeleton Labs Color Token System

## Pattern

```
{property}-{color}-{shade}
```

## Available Colors

- **Semantic**: `primary`, `secondary`, `tertiary`
- **State**: `success`, `warning`, `error`
- **Base**: `surface`

## Shade Scale

11-level brightness scale: `50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`

- Lower numbers = lighter tones
- Higher numbers = darker tones

## Usage Examples

### Background Colors

```html
<div class="bg-primary-500">Primary background</div>
<div class="bg-surface-100">Light surface</div>
```

### Border Colors

```html
<div class="border border-secondary-600">Bordered element</div>
```

### Text Colors

```html
<p class="text-error-700 dark:text-error-300">Error message</p>
```

## Light/Dark Mode Pairing

Format: `{property}-{color}-{lightShade}-{darkShade}`

Automatically switches between light and dark mode:

```html
<div class="bg-surface-50-900">
	<!-- Light mode: bg-surface-50 -->
	<!-- Dark mode: bg-surface-900 -->
</div>

<div class="border-primary-600-400">
	<!-- Light mode: border-primary-600 -->
	<!-- Dark mode: border-primary-400 -->
</div>
```

## Contrast Colors

Accessible text colors: `{color}-contrast-{shade}`

```html
<div class="bg-primary-500 text-primary-contrast-500">Automatically contrasted text</div>
```

## Opacity Support

All colors support Tailwind opacity syntax:

```html
<div class="bg-primary-500/75">75% opacity</div>
<div class="bg-error-600/25">25% opacity</div>
```

## Common Patterns

### Status Indicators

```html
<span class="chip preset-filled-success">✓ Completed</span>
<span class="chip preset-filled-warning">⚠ Pending</span>
<span class="chip preset-filled-error">✗ Failed</span>
```

### Surface Hierarchy

```html
<div class="bg-surface-50-900">
	<div class="bg-surface-100-800">
		<div class="bg-surface-200-700">Nested surfaces</div>
	</div>
</div>
```

### Interactive Elements

```html
<button class="bg-primary-500 hover:bg-primary-600 active:bg-primary-700">Click me</button>
```

## Best Practices

- Use light/dark pairing for automatic theme support
- Prefer semantic colors (primary, secondary) over direct shades
- Use surface colors for backgrounds and containers
- Use state colors (success, warning, error) for status indicators
- Test contrast ratios for accessibility
