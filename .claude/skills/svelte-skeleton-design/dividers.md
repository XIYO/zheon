# Dividers

Horizontal and vertical rule styling for creating visual separators.

## Basic Usage

The `.hr` class applies divider styling to `<hr>` elements:

```html
<div class="w-full space-y-4 text-center">
	<p>Above the divider.</p>
	<hr class="hr" />
	<p>Below the divider.</p>
</div>
```

## Size Customization

Adjust thickness using Tailwind's border-width utilities:

- `border-t-2`
- `border-t-4`
- `border-t-8`

## Style Options

Apply visual patterns with border-style utilities:

- `border-solid` (default)
- `border-dashed`
- `border-dotted`
- `border-double`

## Color Support

Dividers work with Skeleton's color system, including semantic colors:

- `border-primary-500`
- `border-secondary-500`
- `border-success-500`
- `border-warning-500`
- `border-error-500`
- `border-surface-950-50`

## Vertical Dividers

Use the `.vr` class for vertical rules. Requires explicit height setting. Supports all styling options above (e.g., `border-l-8` for thickness).

## Source

[GitHub Repository](https://github.com/skeletonlabs/skeleton/tree/main/packages/skeleton/src/utilities/dividers.css)
