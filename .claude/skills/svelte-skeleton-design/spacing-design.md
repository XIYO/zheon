# Spacing

Skeleton provides a dynamic spacing scale system built on Tailwind CSS.

## Overview

The system enables customization of whitespace throughout applications, with support for per-theme customization.

## How It Works

The system uses Tailwind's official spacing property with a CSS custom property:

```css
@layer theme {
	:root {
		--spacing: 0.25rem;
	}
}
```

This baseline can be customized per theme:

```css
[data-theme='cerberus'] {
	--spacing: 0.25rem;
}
[data-theme='mona'] {
	--spacing: 0.2rem;
}
```

## Scale Values

The spacing scale includes 35 predefined increments:

- 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10
- 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48
- 52, 56, 60, 64, 72, 80

## Supported Properties

The scaling system works with these Tailwind utilities:

- `padding`, `margin`
- `width`, `height` (and min/max variants)
- `gap`, `inset`, `space`, `translate`
