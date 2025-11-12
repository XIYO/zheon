# Presets

Presets are pre-defined utility classes that enable quick styling of interface elements.

## Overview

Presets combine Skeleton and Tailwind primitives to create reusable style combinations for buttons, badges, and cards.

## Built-in Skeleton Presets

### Filled

A filled preset of the primary brand color with automatic contrast color implementation.

Syntax: `preset-filled` or `preset-filled-{color}-{lightModeShade}-{darkModeShade}`

Available shade combinations: 950-50, 900-100, 800-200, 700-300, 600-400, 500, 400-600, 300-700, 200-800, 100-900, 50-950

### Tonal

Ideal for alerts and auxiliary buttons and actions.

Syntax: `preset-tonal` or `preset-tonal-{color}`

Supports: primary, secondary, tertiary, success, warning, error, surface

### Outlined

Ideal for minimal interfaces, such as a surrounding card. Uses same shade system as Filled preset.

## Custom Presets

### Glass Effect

Combines background transparency with backdrop blur for a frosted glass appearance

### Elevated

Mixes filled presets with shadows for depth

### Ghost

Applies styling only on hover states

### Gradient

Uses Tailwind gradient utilities for multi-color backgrounds

## Practical Applications

- **Input validation**: Custom classes for success/error states
- **Gradient buttons/cards**: Fancy multi-color designs
- **Glass morphism**: Semi-transparent, blurred effects over backgrounds

## Implementation Guidelines

- Create presets in global stylesheets using naming convention: `preset-{foo}-{bar}`
- Use Skeleton or Tailwind primitives as building blocks
- Consider Tailwind's `@utility` directive for organized code
- Abstract presets into separate stylesheets or packages for reusability
