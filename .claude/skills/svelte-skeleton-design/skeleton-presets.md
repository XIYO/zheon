# Skeleton Labs Preset System

## Overview

Presets are pre-defined utility classes that allow quick and easy styling of buttons, badges, cards, and more. Skeleton presets mix Skeleton and Tailwind primitives to create reusable style combinations.

## Main Preset Types

### 1. Filled

```
preset-filled-{color}-{lightModeShade}-{darkModeShade}
```

- Versatile for various use cases
- Automatically applies contrasting text colors
- Examples: `preset-filled-primary-500`, `preset-filled-primary-950-50`

### 2. Tonal

```
preset-tonal-{color}
```

- Ideal for notifications and secondary actions
- Simplified structure per color
- Examples: `preset-tonal-primary`, `preset-tonal-error`, `preset-tonal-surface`

### 3. Outlined

```
preset-outlined-{color}-{shade}-{shade}
```

- For minimal interfaces
- Perfect for card outlines
- Examples: `preset-outlined-primary-600-400`, `preset-outlined-secondary-500`

## Available Colors

- `primary`, `secondary`, `tertiary`
- `success`, `warning`, `error`
- `surface`

## Usage Examples

### Buttons and Badges

```html
<button class="btn preset-filled-primary-500">Primary Button</button>
<span class="badge preset-tonal-success">Success Badge</span>
```

### Cards

```html
<div class="card preset-filled-surface-50-900 p-4">Card content</div>
```

### Chips

```html
<button class="chip preset-outlined-primary-600-400">Filter</button>
```

## Custom Presets

Can be defined in global stylesheet following the naming convention:

```css
.preset-{name}-{variation} {
  /* custom styles */
}
```

## Best Practices

- Use filled presets for primary actions
- Use tonal presets for secondary actions and notifications
- Use outlined presets for minimal, secondary UI elements
- Combine with Tailwind utilities for additional customization
