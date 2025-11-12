# Dark Mode

Skeleton integrates Tailwind CSS's dark mode functionality to enable multiple strategies for controlling app-wide or page-specific mode settings.

## Dark Mode Strategies

### Media Strategy

The default approach uses CSS `prefers-color-scheme` to detect and apply the operating system's color preference settings automatically.

### Selector Strategy

Activates dark mode by adding or removing the `.dark` class to the HTML element:

```html
<html class="dark">
	<!-- content -->
</html>
```

### Data Attribute Strategy

Uses a data attribute instead of a class:

```html
<html data-mode="dark">
	<!-- content -->
</html>
```

## Implementing Dark Styles

Apply base styles with Tailwind's `dark:` variant for conditional styling based on mode:

```html
<div class="bg-white dark:bg-black">...</div>
```

## Color Scheme Feature

Skeleton supports toggling light or dark interfaces at any scope using Color Pairings and the CSS `light-dark` property:

```html
<div class="bg-primary-50-950">Light or Dark</div>

<div class="scheme-light">
	<div class="bg-primary-50-950">Always Light Scheme</div>
</div>
```

## Light Switch Component

Previous Skeleton versions included a dedicated Light Switch component. The current recommendation is to build custom implementations following Tailwind's guidelines, with a cookbook recipe available for reference.

## Resources

- [Tailwind Dark Mode Docs](https://tailwindcss.com/docs/dark-mode)
- [MDN prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
