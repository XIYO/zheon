# Skeleton Labs Tailwind Components

## Cards

Container elements that wrap and separate content.

### Basic Structure

```html
<div class="card preset-filled-surface-100-900 p-4">Card content</div>
```

### Preset Combinations

```html
<!-- Filled -->
<div class="card preset-filled-primary-500 p-4">Primary card</div>
<div class="card preset-filled-surface-50-900 p-6">Surface card</div>

<!-- Tonal -->
<div class="card preset-tonal-secondary p-4">Secondary card</div>
<div class="card preset-tonal-error p-4">Error card</div>

<!-- Outlined -->
<div class="card preset-outlined-primary-500 p-4">Outlined card</div>
```

### Best Practices

- Always include padding utilities (`p-4`, `p-6`, etc.)
- Use `preset-filled-surface-50-900` for standard content cards
- Use colored presets sparingly for emphasis
- Combine with Tailwind layout utilities

## Chips

Small, interactive or static UI elements for tags, filters, and selections.

### Text Chips

```html
<button class="chip preset-filled-primary-500">Primary</button>
<button class="chip preset-tonal-secondary">Secondary</button>
<button class="chip preset-outlined-tertiary-500">Tertiary</button>
```

### Icon Chips

```html
<button class="chip-icon preset-filled-primary-500">
	<Icon size="{16}" />
</button>
<button class="chip-icon preset-tonal-success">
	<CheckIcon size="{16}" />
</button>
```

### States

```html
<!-- Disabled -->
<button class="chip preset-filled-primary-500" disabled>
  Disabled
</button>

<!-- Selected (dynamic) -->
<button class={[
  'chip',
  selected ? 'preset-filled-primary-500' : 'preset-tonal-primary'
]}>
  {selected ? 'Selected' : 'Select'}
</button>
```

### Size Variations

```html
<button class="chip preset-tonal-primary text-xs">Small</button>
<button class="chip preset-tonal-primary text-sm">Default</button>
<button class="chip preset-tonal-primary text-base">Large</button>
```

## Placeholders

Skeleton-style loading indicators.

### Basic Placeholders

```html
<!-- Rectangle -->
<div class="placeholder animate-pulse h-4 w-32 rounded"></div>

<!-- Circle -->
<div class="placeholder-circle animate-pulse size-16"></div>
```

### Animation

Always use `animate-pulse` for loading indication:

```html
<div class="placeholder animate-pulse h-8 w-full rounded"></div>
```

### Common Patterns

#### Text Loading

```html
<div class="space-y-3">
	<div class="placeholder animate-pulse h-4 rounded"></div>
	<div class="placeholder animate-pulse h-4 rounded"></div>
	<div class="placeholder animate-pulse h-4 w-4/5 rounded"></div>
</div>
```

#### Avatar Loading

```html
<div class="placeholder-circle animate-pulse size-12"></div>
```

#### Card Loading

```html
<div class="card preset-filled-surface-50-900 p-4">
	<div class="placeholder-circle animate-pulse size-16 mb-4"></div>
	<div class="placeholder animate-pulse h-4 w-3/4 rounded mb-2"></div>
	<div class="placeholder animate-pulse h-3 w-full rounded"></div>
</div>
```

### Color Options

```html
<!-- With preset colors -->
<div class="placeholder preset-filled-primary-500 animate-pulse h-4 rounded"></div>

<!-- With gradient -->
<div
	class="placeholder bg-gradient-to-br from-primary-500 to-secondary-500 animate-pulse h-4 rounded"></div>
```

## Badges

Non-interactive badge styles.

### Basic Usage

```html
<span class="badge preset-filled-success">Success</span>
<span class="badge preset-tonal-warning">Warning</span>
<span class="badge preset-outlined-error-600-400">Error</span>
```

### Icon Badges

```html
<span class="badge-icon preset-filled-primary-500">
	<Icon size="{12}" />
</span>
```

## Best Practices

### Cards

- Use consistent padding (usually `p-4` or `p-6`)
- Nest cards with different surface shades for depth
- Combine with shadow utilities for elevation

### Chips

- Use `chip` for text, `chip-icon` for icons only
- Filled for selected/active state
- Tonal for default state
- Outlined for secondary options

### Placeholders

- Always animate with `animate-pulse`
- Match placeholder dimensions to actual content
- Use `placeholder-circle` for avatars and icons
- Group with spacing utilities

### Component Combinations

```html
<!-- Card with chip tags -->
<div class="card preset-filled-surface-50-900 p-4">
	<h2>Title</h2>
	<div class="flex gap-2 mt-2">
		<span class="chip preset-tonal-primary text-sm">Tag 1</span>
		<span class="chip preset-tonal-secondary text-sm">Tag 2</span>
	</div>
</div>
```
