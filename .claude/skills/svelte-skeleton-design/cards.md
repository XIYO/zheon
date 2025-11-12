# Cards

Container elements that wrap and separate content.

## Basic Card Structure

A simple card implementation uses the `.card` class with styling utilities:

```html
<div class="card w-full max-w-md preset-filled-surface-100-900 p-4 text-center">
	<p>Card</p>
</div>
```

## Card with Header, Article, and Footer

A more complex example with distinct sections:

```html
<a
	href="#"
	class="card preset-filled-surface-100-900 border-[1px] border-surface-200-800
   card-hover divide-surface-200-800 block max-w-md divide-y overflow-hidden">
	<header>
		<img src="{imgSrc}" class="aspect-[21/9] w-full" alt="banner" />
	</header>
	<article class="space-y-4 p-4">
		<h2 class="h6">Announcements</h2>
		<h3 class="h3">Skeleton is Awesome</h3>
		<p>Content here</p>
	</article>
	<footer class="flex items-center justify-between gap-4 p-4">
		<small>By Alex</small>
		<small>On date</small>
	</footer>
</a>
```

## Preset Support

Cards fully support Skeleton design system's preset utilities:

- **Filled variants**: `preset-filled-primary-500`, `preset-filled-secondary-500`, etc.
- **Tonal variants**: `preset-tonal-primary`, `preset-tonal-secondary`, etc.
- **Outlined variants**: `preset-outlined-primary-500`, `preset-outlined-secondary-500`, etc.

Available color options: primary, secondary, tertiary, success, warning, error, and surface.

## Source

[GitHub repository](https://github.com/skeletonlabs/skeleton/tree/main/packages/skeleton/src/utilities/cards.css)
