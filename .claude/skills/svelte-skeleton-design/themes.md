# Themes

Skeleton provides a comprehensive theming system built on CSS custom properties.

## Overview

Skeleton themes are CSS files you import into your global stylesheet. They contain a number of CSS Custom Properties (aka variables). The system uses the Tailwind `@theme` directive with theme files that override default values.

## Preset Themes Available

Skeleton includes 24 preset themes:

- catppuccin, cerberus, concord, crimson, fennec
- hamlindigo, legacy, mint, modern, mona
- nosh, nouveau, pine, reign, rocket
- rose, sahara, seafoam, terminus, vintage
- vox, wintry

## Implementation Steps

### Importing Themes

```css
@import '@skeletonlabs/skeleton/themes/{theme-name}';
```

### Activating a Theme

Add the `data-theme` attribute to your HTML element to set the active theme.

## Customization Options

### Modify Properties

Override CSS variables in preset themes via the `data-theme` selector

### Target Specific Themes

Use attribute selectors with Tailwind variants for theme-specific styling

### Custom Backgrounds

Support mesh gradients and background images with theme colors

### Custom Fonts

Integrate fonts via Fontsource and apply through theme properties

## Resources

- [Theme Generator](https://themes.skeleton.dev/)
- [Core API Documentation](/docs/svelte/get-started/core-api)
- [Mesher Tool](https://csshero.org/mesher/) for gradient generation
