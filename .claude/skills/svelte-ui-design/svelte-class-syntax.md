# Svelte 5 Class Attribute Syntax

## Overview

Svelte 5.16+ supports objects and arrays in the `class` attribute, using clsx internally for powerful class composition.

## Basic Usage

### Primitive Values

```svelte
<div class={large ? 'large' : 'small'}>...</div>
```

## Object Form (Svelte 5.16+)

Truthy keys are added as classes:

```svelte
<script>
	let { cool } = $props();
</script>

<!-- Results in `class="cool"` if cool is truthy,
     `class="lame"` otherwise -->
<div class={{ cool, lame: !cool }}>...</div>
```

### Complex Conditions

```svelte
<div
	class={{
		'base-class': true,
		active: isActive,
		disabled: !isEnabled,
		'primary-500': isPrimary,
		'secondary-500': !isPrimary
	}}>
	Content
</div>
```

## Array Form (Svelte 5.16+)

Truthy values are combined:

```svelte
<!-- If faded and large are truthy:
     results in `class="saturate-0 opacity-50 scale-200"` -->
<div class={[faded && 'saturate-0 opacity-50', large && 'scale-200']}>...</div>
```

### Setting Multiple Classes

```svelte
<div
	class={[
		'base-class',
		condition1 && 'class-1',
		condition2 && 'class-2 class-3',
		condition3 ? 'class-4' : 'class-5'
	]}>
	Content
</div>
```

## Combining Objects and Arrays

Arrays can contain objects, and clsx will flatten them:

```svelte
<div
	class={[
		'base-class',
		{
			active: isActive,
			disabled: isDisabled
		},
		variant === 'primary' && 'bg-primary-500'
	]}>
	Content
</div>
```

## Props Integration

Useful for component props:

```svelte
<!--- file: Button.svelte --->
<script>
	let props = $props();
</script>

<button {...props} class={['cool-button', props.class]}>
	{@render props.children?.()}
</button>
```

```svelte
<!--- file: App.svelte --->
<script>
	import Button from './Button.svelte';
	let useTailwind = $state(false);
</script>

<Button onclick={() => (useTailwind = true)} class={{ 'bg-blue-700 sm:w-1/2': useTailwind }}>
	Button Text
</Button>
```

## TypeScript Type Safety

Use `ClassValue` type for component props:

```svelte
<script lang="ts">
	import type { ClassValue } from 'svelte/elements';

	const props: { class: ClassValue } = $props();
</script>

<div class={['original', props.class]}>...</div>
```

## Legacy `class:` Directive

Prior to Svelte 5.16, use the `class:` directive:

```svelte
<!-- These are equivalent in Svelte 5.16+ -->
<div class={{ cool, lame: !cool }}>...</div>
<div class:cool class:lame={!cool}>...</div>
```

### Shorthand

```svelte
<div class:cool class:lame={!cool}>...</div>
```

## Real-World Examples

### Skeleton Labs Presets

```svelte
<div
	class={[
		'card p-4',
		variant === 'filled' && 'preset-filled-surface-50-900',
		variant === 'tonal' && 'preset-tonal-surface',
		variant === 'outlined' && 'preset-outlined-surface-500'
	]}>
	Content
</div>
```

### Status-Based Styling

```svelte
<a
	href={url}
	class={[
		'block border-4 rounded-xl overflow-hidden',
		{
			'border-warning-600-400': status === 'pending',
			'border-primary-600-400': status === 'processing',
			'border-error-600-400': status === 'failed',
			'border-success-600-400': status === 'completed',
			'border-surface-300-700': !status
		}
	]}>
	<img src={thumbnail} alt={title} />
</a>
```

### Interactive States

```svelte
<button
	class={[
		'chip',
		{
			'preset-filled-primary-500': selected,
			'preset-tonal-primary': !selected,
			'opacity-50': disabled,
			'cursor-not-allowed': disabled
		}
	]}
	{disabled}>
	{label}
</button>
```

## Best Practices

1. **Prefer Object/Array over `class:`**: More composable and powerful (Svelte 5.16+)
2. **Base Classes First**: Put constant classes at the start
3. **Group Related Conditions**: Use objects for mutually exclusive states
4. **Use Arrays for Additive Classes**: When multiple conditions can be true simultaneously
5. **Combine with Props**: Use arrays to merge component props with local classes

## Common Patterns

### Conditional Preset Application

```svelte
<div class={[
  'base-component',
  presetStyle && `preset-${presetStyle}-${color}`
]}>
```

### Size Variants

```svelte
<button class={{
  'base-button': true,
  'text-xs px-2 py-1': size === 'sm',
  'text-sm px-3 py-2': size === 'md',
  'text-base px-4 py-3': size === 'lg'
}}>
```

### Theme Switching

```svelte
<div class={[
  'container',
  {
    'dark-theme': theme === 'dark',
    'light-theme': theme === 'light',
    'auto-theme': theme === 'auto'
  }
]}>
```
