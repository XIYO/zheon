# Colors

The Skeleton color system provides guardrails and utilities for crafting custom color systems.

## Color Palette Structure

Skeleton offers seven primary color groups:

- **Primary, Secondary, Tertiary** - Brand and accent colors
- **Success, Warning, Error** - Status indicators
- **Surface** - Background and neutral elements

Each color includes 11 shades: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950.

## Utility Class Pattern

Colors use the syntax: `{property}-{color}-{shade}`

**Properties:** accent, bg, border, caret, decoration, divide, fill, outline, ring, shadow, stroke, text

**Example Usage:**

```html
<div class="bg-primary-500">...</div>
<div class="border border-secondary-600">...</div>
<svg class="fill-surface-950">...</svg>
```

## Contrast Colors

Contrast color values are available for every shade in the color ramp to ensure accessible text and icon colors:

```
{property}-{color}-contrast-{shade}
```

## Color Pairings

Pairings provide dual-tone syntax for light/dark modes:

```
{property}-{color}-{lightShade}-{darkShade}
```

```html
<div class="bg-surface-200-800">...</div>
<div class="text-primary-300-700">...</div>
```

Uses CSS `light-dark()` function for automatic mode switching.

## Transparency Support

All colors support Tailwind transparency syntax:

```html
<div class="bg-primary-500/25">25% transparency</div>
<div class="bg-surface-50-950/60">60% transparency</div>
```
