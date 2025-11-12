# Tailwind CSS 4 Utility Classes

## Core Concept

Tailwind is a utility-first CSS framework. Build designs by composing single-purpose utility classes directly in markup.

Example: `"flex p-6 rounded-xl bg-white shadow-lg"`

## Key Advantages

- **Speed**: No naming or switching between files
- **Safety**: Changes only affect specific elements
- **Maintainability**: Modify only the relevant markup
- **Reusability**: Copy entire UI chunks easily

## State Variants

Apply classes conditionally based on state:

### Hover/Focus

```html
<button class="hover:bg-sky-700">Hover me</button>
<input class="focus:border-blue-500" />
```

### Responsive

```html
<div class="sm:grid-cols-3 lg:grid-cols-4">
	<!-- 3 columns on small, 4 on large -->
</div>
```

### Dark Mode

```html
<div class="bg-white dark:bg-gray-800">
	<!-- Auto switches based on system preference -->
</div>
```

### Combining Variants

```html
<div class="dark:lg:hover:bg-indigo-600">
	<!-- Dark mode + large screen + hover -->
</div>
```

## Class Composition

Multiple utilities can target the same CSS property:

```html
<div class="blur-sm grayscale">
	<!-- Both filters apply simultaneously -->
</div>
```

## Arbitrary Values

Use bracket notation for custom values not in the theme:

```html
<!-- Custom color -->
<div class="bg-[#316ff6]"></div>

<!-- Complex grid -->
<div class="grid-cols-[24rem_2.5rem_minmax(0,1fr)]"></div>

<!-- Custom spacing -->
<div class="p-[13px]"></div>
```

## Dynamic Utilities (v4)

Generate utilities without configuration:

```html
<!-- Arbitrary grid columns -->
<div class="grid grid-cols-15">
	<!-- Creates 15-column grid automatically -->
</div>
```

## Handling Repetition

### Loops

Use template loops to avoid duplication:

```svelte
{#each items as item}
	<div class="p-4 bg-white rounded">
		{item.name}
	</div>
{/each}
```

### Multi-Cursor Editing

Select multiple similar elements and edit simultaneously.

### Components

Extract repeated patterns into components:

```svelte
<Card class="p-4 bg-white shadow">Content</Card>
```

### Custom CSS (when needed)

```css
@layer components {
	.btn-primary {
		@apply px-4 py-2 bg-blue-500 text-white rounded;
	}
}
```

## Style Conflicts

When two classes target the same property, the later one in the stylesheet wins.

### Force Override

```html
<div class="bg-red-500!">
	<!-- ! forces this class to win -->
</div>
```

## Common Utility Categories

### Layout

```html
<div class="flex flex-col items-center justify-between">
	<div class="grid grid-cols-3 gap-4">
		<div class="container mx-auto"></div>
	</div>
</div>
```

### Spacing

```html
<div class="p-4">Padding</div>
<div class="m-auto">Margin</div>
<div class="space-y-4">Vertical spacing</div>
```

### Typography

```html
<p class="text-lg font-bold text-gray-900"></p>
<p class="leading-relaxed tracking-wide"></p>
```

### Backgrounds & Borders

```html
<div class="bg-gradient-to-r from-blue-500 to-purple-500">
	<div class="border-2 border-gray-300 rounded-lg"></div>
</div>
```

### Effects

```html
<div class="shadow-lg hover:shadow-xl transition-shadow">
	<div class="opacity-75 hover:opacity-100"></div>
</div>
```

## Tailwind 4 Specific Features

### Container Queries

```html
<div class="@container">
	<div class="@lg:flex">
		<!-- Responsive based on container, not viewport -->
	</div>
</div>
```

### 3D Transforms

```html
<div class="rotate-x-45 translate-z-8">3D transformed element</div>
```

### Expanded Gradients

```html
<div class="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">Multi-stop gradient</div>
```

### Starting Styles (Enter/Exit Transitions)

```html
<div class="@starting:opacity-0 @starting:scale-95">
	<!-- Animates from these values on enter -->
</div>
```

### Not Variant

```html
<div class="not-first:mt-4">
	<!-- Applies to all except first -->
</div>
```

## Best Practices

1. **Start with Layout**: Use flex/grid first
2. **Add Spacing**: Then padding and margins
3. **Style Elements**: Colors, borders, shadows
4. **Add Interactivity**: Hover, focus, active states
5. **Make Responsive**: Add breakpoint variants
6. **Optimize for Dark Mode**: Add dark: variants

## Responsive Design Pattern

```html
<div
	class="
  p-4 sm:p-6 lg:p-8
  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
  gap-4 lg:gap-6
">
	Mobile-first, progressively enhanced
</div>
```

## Dark Mode Pattern

```html
<div
	class="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-white
  border border-gray-200 dark:border-gray-700
">
	Automatic theme switching
</div>
```
