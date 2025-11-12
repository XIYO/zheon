# Tailwind CSS State Variants

## Overview

All Tailwind utility classes can be applied conditionally using variants. Variants target specific states like hover, focus, or screen sizes.

## Basic Syntax

```html
<element class="variant:utility"></element>
```

Example:

```html
<button class="bg-sky-500 hover:bg-sky-700">Save changes</button>
```

## Interaction States

### Hover

```html
<div class="hover:bg-gray-100">Hover over me</div>
<button class="hover:scale-105">Hover to scale</button>
```

### Focus

```html
<input class="focus:border-blue-500 focus:ring-2" />
<button class="focus:outline-none focus-visible:ring-2">Accessible focus</button>
```

### Active

```html
<button class="active:bg-blue-700">Click and hold</button>
```

### Focus-Visible

Keyboard focus only (not mouse):

```html
<button class="focus-visible:ring-2 focus-visible:ring-blue-500">Tab to focus</button>
```

### Visited

For links:

```html
<a href="#" class="text-blue-500 visited:text-purple-500">Link</a>
```

## Form States

### Disabled

```html
<input class="disabled:opacity-50 disabled:cursor-not-allowed" />
<button class="disabled:bg-gray-300" disabled>Disabled</button>
```

### Enabled

```html
<input class="enabled:border-blue-500" />
```

### Required

```html
<input class="required:border-red-500" required />
```

### Invalid

```html
<input class="invalid:border-pink-500 invalid:text-pink-600" />
```

### Valid

```html
<input class="valid:border-green-500" />
```

### Checked

```html
<input type="checkbox" class="checked:bg-blue-500" />
```

### Indeterminate

```html
<input type="checkbox" class="indeterminate:bg-gray-500" />
```

### Placeholder

```html
<input class="placeholder:text-gray-400 placeholder:italic" />
```

## Structural Variants

### First/Last Child

```html
<ul>
	<li class="first:pt-0 last:pb-0">Item</li>
</ul>
```

### Odd/Even

```html
<tr class="odd:bg-gray-50 even:bg-white">Table row</tr>
```

### Only Child

```html
<div class="only:text-center">Only child</div>
```

### Empty

```html
<div class="empty:hidden">Shows only when not empty</div>
```

## Data Attribute Variants

### Boolean Data Attributes

```html
<div data-active class="data-active:border-purple-500">Active when data-active exists</div>

<div data-loading class="data-loading:opacity-50">Loading state</div>
```

### Specific Value Matching

```html
<div data-size="large" class="data-[size=large]:p-8">Large padding for large size</div>

<div data-state="open" class="data-[state=open]:rotate-180">Rotates when open</div>
```

### Custom Data Variants

Register custom data attribute patterns:

```css
@custom-variant data-checked (&[data-ui~="checked"]);
```

```html
<div data-ui="checked" class="data-checked:bg-blue-500">Uses custom variant</div>
```

## Group Variants

Style based on parent state:

### Group Hover

```html
<div class="group">
	<img class="group-hover:scale-110" />
	<p class="group-hover:text-blue-500">Hover parent</p>
</div>
```

### Group Focus

```html
<div class="group">
	<input class="peer" />
	<label class="group-focus:text-blue-500">Label changes on input focus</label>
</div>
```

## Peer Variants

Style based on sibling state:

```html
<input class="peer" type="checkbox" />
<label class="peer-checked:text-blue-500">Checkbox label</label>

<input class="peer" required />
<p class="peer-invalid:block hidden">Error message</p>
```

## Responsive Variants

### Breakpoint Variants

```html
<div
	class="
  grid-cols-1
  sm:grid-cols-2
  md:grid-cols-3
  lg:grid-cols-4
  xl:grid-cols-5
">
	Responsive grid
</div>
```

### Container Queries

```html
<div class="@container">
	<div class="@lg:flex @lg:gap-4">Responsive based on container</div>
</div>
```

## Dark Mode

```html
<div
	class="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-white
">
	Auto theme switching
</div>
```

## Combining Variants

Multiple variants can be chained:

```html
<button
	class="
  dark:lg:hover:bg-fuchsia-600
  dark:md:focus-visible:ring-2
">
	Complex conditional styling
</button>
```

Order: `dark` → `lg` → `hover`

## Not Variant (v4)

Negate conditions:

```html
<div class="not-first:mt-4">All except first have top margin</div>

<input class="not-disabled:hover:border-blue-500" />
```

## Arbitrary Variants

Create custom conditions:

```html
<div class="[&:nth-child(3)]:bg-blue-500">Third child is blue</div>

<div class="[&_p]:text-gray-500">All p tags inside are gray</div>
```

## Stacking Order

Variants have precedence order:

1. Base classes
2. Responsive variants (`sm:`, `md:`, etc.)
3. State variants (`hover:`, `focus:`, etc.)
4. Dark mode (`dark:`)
5. Important (`!`)

## Common Patterns

### Button States

```html
<button
	class="
  bg-blue-500
  hover:bg-blue-600
  active:bg-blue-700
  disabled:bg-gray-300
  disabled:cursor-not-allowed
  focus-visible:ring-2
  focus-visible:ring-blue-500
">
	Interactive Button
</button>
```

### Form Validation

```html
<input
	class="
  border
  border-gray-300
  focus:border-blue-500
  focus:ring-2
  focus:ring-blue-200
  invalid:border-red-500
  invalid:text-red-600
  disabled:bg-gray-100
  disabled:cursor-not-allowed
" />
```

### Card Hover Effect

```html
<div
	class="
  group
  transition-all
  hover:shadow-lg
  hover:-translate-y-1
">
	<img class="group-hover:scale-105 transition-transform" />
	<h3 class="group-hover:text-blue-500">Title</h3>
</div>
```

### Responsive Navigation

```html
<nav
	class="
  flex flex-col md:flex-row
  gap-2 md:gap-4
  p-4 md:p-6
">
	<a
		class="
    hover:text-blue-500
    focus-visible:ring-2
    md:hover:underline
  ">
		Link
	</a>
</nav>
```

### Dark Mode Toggle

```html
<div
	class="
  bg-white dark:bg-gray-900
  border border-gray-200 dark:border-gray-700
  text-gray-900 dark:text-white
  shadow dark:shadow-none
">
	Theme-aware content
</div>
```

## Best Practices

1. **Order Logically**: Base → Responsive → Interactive → Dark mode
2. **Use Focus-Visible**: Better keyboard navigation UX
3. **Test All States**: Verify hover, focus, active, disabled
4. **Consider Accessibility**: Ensure sufficient contrast in all states
5. **Group Related Variants**: Keep related states together for readability
6. **Leverage Peer/Group**: Reduce JavaScript for coordinated states
7. **Test Dark Mode**: Always verify dark mode combinations
