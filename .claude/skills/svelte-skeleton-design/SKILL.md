---
name: svelte-skeleton-design
description: ALWAYS use this skill for ANY Svelte component styling, design, or UI work. Provides comprehensive guidance for Svelte 5 components using Skeleton Labs UI toolkit and Tailwind CSS 4. ALWAYS read svelte-class-syntax.md for class composition. Use style directive for dynamic CSS variables with Tailwind arbitrary values (bg-(--color)). Applies to all component design, styling, colors, layouts, animations, forms, cards, buttons, and any visual work in Svelte projects.
---

# Svelte + Skeleton Labs + Tailwind 4 Design Skill

This skill should be used when designing or styling Svelte 5 components using Skeleton Labs UI toolkit and Tailwind CSS 4. It provides comprehensive guidance on modern class composition, color systems, component styling, and design tokens. Use this skill when users request design work with phrases like "Skeleton Labs 토큰을 사용해서", "preset으로 스타일링", "Svelte class 문법으로", or "Tailwind 4로 디자인".

## Overview

Design Svelte 5 components using modern tooling: Skeleton Labs UI presets, Tailwind CSS 4 utilities, and Svelte 5.16+ class syntax with `style:` directive. This skill provides authoritative reference documentation for interconnected systems that work together to create beautiful, maintainable user interfaces.

**Core Principle**: Use Svelte `class` for static Tailwind utilities and `style:` directive for dynamic CSS variable values. Reference CSS variables in class with Tailwind arbitrary values: `bg-(--color)` or `bg-[var(--color)]`.

## When to Use This Skill

**This skill is AUTOMATICALLY activated for:**

- ANY Svelte component creation or modification
- ALL styling, design, and UI work in Svelte projects
- Component props, layouts, colors, spacing, typography
- Forms, buttons, cards, chips, badges, tables, placeholders
- Animations, transitions, hover effects, responsive design
- Dark mode, themes, conditional styling, dynamic values

**Manual activation (if needed):** Simply mention "svelte-skeleton-design 스킬 사용해줘" in your request.

**Common scenarios:**

- "컴포넌트 만들어줘" → Auto-triggered
- "스타일 바꿔줘" → Auto-triggered
- "버튼 디자인해줘" → Auto-triggered
- "색상 동적으로 변경" → Auto-triggered
- Any Svelte UI work → Auto-triggered

## Core Design Systems

### 1. Skeleton Labs UI Toolkit

Skeleton Labs provides pre-built design tokens optimized for Svelte + Tailwind:

**Presets**: Pre-defined utility combinations

- `preset-filled-{color}-{lightShade}-{darkShade}` - Filled backgrounds with auto-contrast
- `preset-tonal-{color}` - Subtle tonal variations
- `preset-outlined-{color}-{shade}-{shade}` - Border-only styling

**Color Tokens**: 11-step scale with light/dark pairing

- Pattern: `{property}-{color}-{lightShade}-{darkShade}`
- Auto-switches between light/dark modes
- Example: `bg-primary-600-400`, `border-error-600-400`

**Components**: Pre-styled UI elements

- `card` - Container elements with preset combinations
- `chip` / `chip-icon` - Interactive tags and filters
- `placeholder` / `placeholder-circle` - Loading skeletons
- `badge` / `badge-icon` - Status indicators

**Reference**: Read `skeleton-presets.md`, `skeleton-colors.md`, and `skeleton-components.md` for complete documentation.

### 2. Svelte 5 Class Syntax

Svelte 5.16+ supports powerful class composition using objects and arrays:

**Object Form**: Conditional classes based on boolean keys

```svelte
<div class={{
  'base-class': true,
  'border-warning-600-400': status === 'pending',
  'border-primary-600-400': status === 'processing',
  'border-error-600-400': status === 'failed',
  'border-success-600-400': status === 'completed'
}}>
```

**Array Form**: Combine multiple conditional classes

```svelte
<div class={[
  'block border-4 rounded-xl overflow-hidden',
  condition && 'extra-class',
  variant === 'primary' && 'bg-primary-500'
]}>
```

**Combined**: Arrays can contain objects

```svelte
<div class={[
  'chip',
  {
    'preset-filled-primary-500': selected,
    'preset-tonal-primary': !selected,
    'opacity-50': disabled
  }
]}>
```

**Reference**: Read `svelte-class-syntax.md` for complete patterns and examples.

### 2.5. Svelte 5 Style Directive

**IMPORTANT**: Always use Svelte 5 `style:` directive for dynamic CSS variable values.

Svelte 5 provides the `style:` directive for setting inline styles:

```svelte
<!-- Dynamic CSS variables with style: directive -->
<div
	class="bg-(--custom-bg) text-(--custom-text)"
	style:--custom-bg={backgroundColor}
	style:--custom-text={textColor}>
	Dynamic styling
</div>
```

**Key Patterns**:

1. **CSS Variable Assignment**: Set dynamic CSS custom properties

```svelte
<div
  style:--primary-color={brandColor}
  style:--spacing={`${size}px`}
  class="bg-(--primary-color) p-(--spacing)">
```

2. **Shorthand Form**: Variable name matches property

```svelte
<script>
	let color = 'red';
</script>

<div style:color>Uses color variable value</div>
```

3. **Important Modifier**: Force style precedence

```svelte
<div style:color|important="red">Always red</div>
```

4. **Multiple Styles**: Combine multiple style directives

```svelte
<div
  style:color={textColor}
  style:background-color={bgColor}
  style:width="12rem">
```

**Best Practice**: Use `style:` for dynamic values, `class` for static Tailwind utilities:

```svelte
<div class="rounded-xl p-4 bg-(--brand-color)" style:--brand-color={dynamicColor}>
	Correct pattern
</div>
```

### 3. Tailwind CSS 4

Modern utility-first CSS framework with CSS-first configuration:

**Utilities**: Single-purpose classes for rapid development

- Layout: `flex`, `grid`, `container`
- Spacing: `p-4`, `m-auto`, `space-y-4`
- Typography: `text-lg`, `font-bold`
- Colors: `bg-blue-500`, `text-gray-900`
- States: `hover:`, `focus:`, `dark:`, `data-*:`

**Color System**: OKLCH-based palette with 11-step scale

- Format: `{property}-{color}-{shade}`
- Opacity support: `bg-blue-500/50`
- Gradients: `bg-gradient-to-r from-blue-500 to-purple-500`

**CSS Variable Reference**: Use arbitrary values to reference CSS custom properties

- Shorthand: `bg-(--my-color)` automatically wraps in `var()`
- Full syntax: `bg-[var(--my-color)]` explicit var() function
- Combined with Svelte: `class="bg-(--brand-color)" style:--brand-color={color}`
- Type hints for ambiguous cases: `text-(color:--my-var)` or `text-(length:--my-var)`

**Theme Configuration**: CSS-based via `@theme` directive

```css
@theme {
	--color-brand: oklch(0.84 0.18 117.33);
	--font-display: 'Satoshi', 'sans-serif';
}
```

**State Variants**: Conditional styling

- Interaction: `hover:`, `focus:`, `active:`
- Forms: `disabled:`, `invalid:`, `checked:`
- Structure: `first:`, `last:`, `odd:`, `even:`
- Data attributes: `data-active:`, `data-[size=large]:`
- Responsive: `sm:`, `md:`, `lg:`, `xl:`

**Reference**: Read `tailwind-utilities.md`, `tailwind-colors.md`, `tailwind-theme.md`, and `tailwind-variants.md` for comprehensive documentation.

## Design Workflow

### Step 1: Identify the Component Type

Determine which Skeleton Labs component best fits:

- Containers → `card`
- Interactive elements → `chip` / `chip-icon`
- Status indicators → `badge` / `badge-icon`
- Loading states → `placeholder` / `placeholder-circle`

### Step 2: Choose the Styling Approach

Select the appropriate pattern:

- **Static styling**: Simple Tailwind utilities
- **Conditional styling**: Svelte 5 class syntax (object/array)
- **State-based**: Skeleton Labs presets with status mapping
- **Responsive**: Tailwind breakpoint variants
- **Theme-aware**: Skeleton Labs color pairing or Tailwind dark mode

### Step 3: Apply Design Tokens

Layer the design system:

1. **Base structure**: Skeleton component class (`card`, `chip`, etc.)
2. **Preset styling**: Skeleton preset (`preset-filled-*`, `preset-tonal-*`)
3. **Tailwind utilities**: Spacing, sizing, layout
4. **Dynamic values**: Use `style:` directive for CSS variables
5. **Conditional logic**: Svelte class composition
6. **Variants**: Hover, focus, responsive, dark mode

**Dynamic styling pattern**:

```svelte
<div
  class="bg-(--dynamic-bg) text-(--dynamic-text)"
  style:--dynamic-bg={backgroundColor}
  style:--dynamic-text={textColor}>
```

### Step 4: Ensure Accessibility

- Sufficient color contrast (WCAG AA/AAA)
- Focus-visible states for keyboard navigation
- Disabled states clearly indicated
- Semantic HTML with proper ARIA attributes

## Common Design Patterns

### Status-Based Borders

```svelte
<a
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
	Content
</a>
```

### Interactive Cards

```svelte
<div
	class={[
		'card preset-filled-surface-50-900 p-4',
		'transition-all hover:shadow-lg hover:-translate-y-1',
		selected && 'ring-2 ring-primary-500'
	]}>
	Card content
</div>
```

### Selection Chips

```svelte
<button
	class={[
		'chip',
		{
			'preset-filled-primary-500': selected,
			'preset-tonal-primary': !selected,
			'opacity-50 cursor-not-allowed': disabled
		}
	]}
	{disabled}>
	{label}
</button>
```

### Loading Placeholders

```svelte
{#if loading}
	<div class="card preset-filled-surface-50-900 p-4">
		<div class="placeholder-circle animate-pulse size-16 mb-4"></div>
		<div class="placeholder animate-pulse h-4 w-3/4 rounded mb-2"></div>
		<div class="placeholder animate-pulse h-3 w-full rounded"></div>
	</div>
{:else}
	<div class="card preset-filled-surface-50-900 p-4">
		<!-- Actual content -->
	</div>
{/if}
```

### Dark Mode Theming

```svelte
<div
	class="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-white
  border border-gray-200 dark:border-gray-700
">
	Auto-themed content
</div>
```

### Dynamic Styling with CSS Variables

```svelte
<script>
	let brandColor = $state('#ff5500');
	let spacing = $state(16);
</script>

<div
	class="bg-(--brand-bg) text-(--brand-text) p-(--spacing)"
	style:--brand-bg={brandColor}
	style:--brand-text={getContrastColor(brandColor)}
	style:--spacing={`${spacing}px`}>
	Dynamic themed content
</div>
```

### Conditional Dynamic Styling

```svelte
<script>
	let status = $state('success');

	const statusColors = {
		success: '#10b981',
		warning: '#f59e0b',
		error: '#ef4444'
	};
</script>

<div
	class={['card p-4 border-4', 'border-(--status-color)']}
	style:--status-color={statusColors[status]}>
	Status: {status}
</div>
```

## Reference Documentation

This skill includes comprehensive reference documentation from Skeleton Labs official docs.

### Get Started

- `introduction.md` - Skeleton overview and philosophy
- `installation.md` - Framework-specific installation guides
- `fundamentals.md` - Core pillars: Design System, Tailwind Components, Framework Components
- `core-api.md` - @base, @theme, @utility, @variant layers
- `migrate-v2-to-v3.md` - v2 to v3 migration guide
- `migrate-v3-to-v4.md` - v3 to v4 migration guide

### Guides

- `dark-mode.md` - Dark mode strategies and color scheme
- `layouts.md` - Responsive layout patterns with semantic HTML
- `cookbook.md` - Recipe collection for common UI features

### Design System

- `themes.md` - Theme system and preset themes
- `colors-design.md` - Color palette structure and utilities
- `presets-design.md` - Built-in and custom preset patterns
- `typography-design.md` - Typography scale and semantic styles
- `spacing-design.md` - Dynamic spacing system
- `iconography.md` - Icon library recommendations

### Tailwind Components

- `badges.md` - Non-interactive badge styles
- `buttons.md` - Button styles and sizes
- `cards.md` - Container elements
- `chips.md` - Interactive chip styles
- `dividers.md` - Horizontal and vertical rules
- `forms.md` - Form and input styling
- `placeholders.md` - Skeleton loading states
- `tables.md` - Native HTML table styling

### Design Tokens (Original)

- `skeleton-presets.md` - Complete Skeleton Labs preset system
- `skeleton-colors.md` - Color token patterns and pairing
- `skeleton-components.md` - Cards, chips, placeholders, badges
- `svelte-class-syntax.md` - Svelte 5.16+ class composition
- `tailwind-utilities.md` - Tailwind CSS 4 utility classes
- `tailwind-colors.md` - OKLCH color system and customization
- `tailwind-theme.md` - CSS-first @theme configuration
- `tailwind-variants.md` - State variants and conditional styling

**When to load references:**

- Load specific files when working with that subsystem
- For comprehensive redesigns, load all relevant references
- Start with Get Started docs for understanding fundamentals
- Use Design System docs for theming and color work
- Load Tailwind Components for specific component styling
- Use standard Markdown links: [skeleton-presets.md](skeleton-presets.md)

## Best Practices

### Composition Order

1. Base component class (`card`, `chip`)
2. Skeleton preset (`preset-filled-*`)
3. Tailwind layout (`flex`, `grid`)
4. Tailwind spacing (`p-4`, `gap-2`)
5. CSS variable classes (`bg-(--custom-color)`)
6. Conditional classes (Svelte class syntax)
7. Interactive variants (`hover:`, `focus:`)
8. Responsive variants (`sm:`, `md:`)
9. Dark mode variants (`dark:`)

**Separate from class**: Use `style:` directive for dynamic CSS variable values

```svelte
<div
  class="bg-(--brand-color) p-4"
  style:--brand-color={dynamicColor}>
```

### Performance

- Use Svelte class arrays/objects over ternaries (cleaner, clsx-powered)
- Prefer Skeleton presets over custom utility combinations
- Leverage Tailwind's JIT for minimal CSS output
- Use `@theme` for custom design tokens (faster than JavaScript config)

### Maintainability

- Group related classes together
- Use Skeleton presets for consistent theming
- Document custom color tokens in `@theme`
- Test all states (hover, focus, disabled, dark mode)

### Accessibility

- Always use `focus-visible:` for keyboard navigation
- Maintain WCAG contrast ratios
- Provide disabled states with `cursor-not-allowed`
- Test with keyboard-only navigation

## Integration with Svelte 5

This skill integrates seamlessly with Svelte 5 features:

- **Runes**: `$state`, `$derived`, `$props` for reactive styling
- **Snippets**: `{@render}` for reusable styled components
- **Effects**: `$effect` for dynamic class updates
- **TypeScript**: `ClassValue` type for prop definitions

## Example: Complete Component

```svelte
<script>
	import type { ClassValue } from 'svelte/elements';

	let {
		status = $bindable(),
		variant = 'default',
		class: className
	}: {
		status?: 'pending' | 'processing' | 'completed' | 'failed';
		variant?: 'default' | 'compact';
		class?: ClassValue;
	} = $props();

	const isProcessing = $derived(status === 'processing');
</script>

<div
	class={[
		'card preset-filled-surface-50-900',
		{
			'p-4': variant === 'default',
			'p-2': variant === 'compact'
		},
		'transition-all',
		className
	]}>
	<div
		class={[
			'flex items-center gap-2',
			{
				'border-l-4 pl-4': status,
				'border-warning-600-400': status === 'pending',
				'border-primary-600-400': status === 'processing',
				'border-error-600-400': status === 'failed',
				'border-success-600-400': status === 'completed'
			}
		]}>
		{#if isProcessing}
			<div class="placeholder-circle animate-pulse size-6"></div>
		{/if}

		<span
			class={[
				'chip text-sm',
				{
					'preset-tonal-warning': status === 'pending',
					'preset-filled-primary-500': status === 'processing',
					'preset-tonal-error': status === 'failed',
					'preset-filled-success': status === 'completed'
				}
			]}>
			{status || 'unknown'}
		</span>
	</div>
</div>
```

This example demonstrates:

- TypeScript with `ClassValue` for prop types
- Svelte 5 runes (`$props`, `$derived`, `$bindable`)
- Skeleton Labs presets and components
- Tailwind utilities with responsive spacing
- Conditional styling with object syntax
- Status-based color mapping
- Loading states with placeholders
