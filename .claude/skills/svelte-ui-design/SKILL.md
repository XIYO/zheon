---
name: svelte-ui-design
description: ALWAYS use this skill for ANY Svelte component styling, design, or UI work. Complete Svelte 5 UI design system including Tailwind CSS 4, Skeleton Labs design tokens, Bits UI headless components, and Skeleton UI component library. Covers class composition, color systems, interactive components, forms, overlays, and all visual design. Use for any design, styling, or component work in Svelte projects.
---

# Svelte UI Design System

Complete design system for Svelte 5 projects integrating Tailwind CSS 4, Skeleton Labs design tokens, Bits UI headless components, and Skeleton UI component library. This unified skill provides comprehensive guidance for all styling, design, and component work.

## Overview

Design Svelte 5 components using modern tooling that works together seamlessly:

- **Tailwind CSS 4**: Utility-first CSS framework
- **Skeleton Labs**: Design tokens, presets, and color system
- **Bits UI**: Headless component primitives
- **Skeleton UI**: Full-featured component library
- **Svelte 5**: Class syntax and style directive

**Core Principle**: Use Svelte `class` for static Tailwind utilities and `style:` directive for dynamic CSS variable values. Choose between Bits UI (headless) or Skeleton UI (styled) components based on design control needs.

## When to Use This Skill

**This skill is AUTOMATICALLY activated for:**

- ANY Svelte component creation or modification
- ALL styling, design, and UI work in Svelte projects
- Component props, layouts, colors, spacing, typography
- Forms, buttons, cards, chips, badges, tables, placeholders
- Dialogs, popovers, tooltips, accordions, tabs
- Animations, transitions, hover effects, responsive design
- Dark mode, themes, conditional styling, dynamic values
- Headless components, accessible components, interactive components

**Common scenarios:**

- "컴포넌트 만들어줘" → Auto-triggered
- "Dialog 만들어줘" → Auto-triggered (Bits UI or Skeleton UI)
- "스타일 바꿔줘" → Auto-triggered
- "버튼 디자인해줘" → Auto-triggered
- "색상 동적으로 변경" → Auto-triggered
- Any Svelte UI work → Auto-triggered

## Core Design Systems

This skill integrates five interconnected systems for complete Svelte UI development:

### 1. Tailwind CSS 4

Modern utility-first CSS framework with CSS-first configuration:

**Key Features**:
- OKLCH color system
- CSS-first `@theme` configuration
- Arbitrary value syntax: `bg-(--color)`, `bg-[var(--color)]`
- State variants: `hover:`, `focus:`, `dark:`, `data-*:`
- Responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`

**Reference**: `tailwind-utilities.md`, `tailwind-colors.md`, `tailwind-theme.md`, `tailwind-variants.md`

### 2. Skeleton Labs Design Tokens

Pre-built design tokens optimized for Svelte + Tailwind:

**Presets**:
- `preset-filled-{color}-{lightShade}-{darkShade}` - Filled backgrounds
- `preset-tonal-{color}` - Subtle tonal variations
- `preset-outlined-{color}-{shade}-{shade}` - Border-only styling

**Color Tokens**: 11-step scale with light/dark pairing
- Pattern: `{property}-{color}-{lightShade}-{darkShade}`
- Example: `bg-primary-600-400`, `border-error-600-400`

**Basic Components**: `card`, `chip`, `badge`, `placeholder`

**Reference**: `skeleton-ui-complete.md`

### 3. Svelte 5 Class Syntax

Powerful class composition using objects and arrays:

**Object Form**:
```svelte
<div class={{
  'base-class': true,
  'border-primary-600-400': isActive,
  'border-error-600-400': hasError
}}>
```

**Array Form**:
```svelte
<div class={[
  'block border-4 rounded-xl',
  condition && 'extra-class'
]}>
```

**Style Directive** (for dynamic CSS variables):
```svelte
<div
  class="bg-(--brand-color)"
  style:--brand-color={dynamicColor}>
```

**Reference**: `svelte-class-syntax.md`

### 4. Bits UI - Headless Components

Headless component library with full accessibility and customization:

**Components (42)**:
- Layout: Accordion, Collapsible, Tabs, Separator
- Overlays: Dialog, Popover, Tooltip, Context Menu
- Forms: Checkbox, Radio Group, Switch, Slider, Select, Combobox
- Date/Time: Calendar, Date Picker, Time Field
- Navigation: Dropdown Menu, Menubar, Navigation Menu
- Display: Avatar, Progress, Meter

**Key Features**:
- Completely unstyled
- Full keyboard navigation
- WAI-ARIA compliance
- Child snippet pattern for custom rendering
- State management with `bind:`

**When to use**: Maximum design control, custom styling needed

**Reference**: `bits-ui-complete.md` (22,079 lines - complete API docs)

### 5. Skeleton UI - Styled Component Library

Full-featured component library with Skeleton design system integration:

**Components (27)**:
- Layout: App Bar, Navigation, Tabs, Pagination
- Disclosure: Accordion, Collapsible
- Overlays: Dialog, Popover, Tooltip, Toast
- Forms: Combobox, Date Picker, File Upload, Slider, Switch, Tags Input
- Display: Avatar, Progress (Circular/Linear), Tree View

**Key Features**:
- Pre-styled with Skeleton design tokens
- Tailwind CSS integration
- Zag.js-based behavior
- Dark mode support
- Built-in animations

**When to use**: Rapid development, consistent styling, Skeleton design system

**Reference**: `skeleton-ui-complete.md` (12,309 lines - complete API docs)

## Component Selection Guide

### When to Use Bits UI

- Need complete design control
- Custom design system (not Skeleton)
- Minimal styling required
- Advanced customization needs
- Using with non-Skeleton Tailwind setup

**Example**:
```svelte
<script lang="ts">
  import { Dialog } from "bits-ui";
</script>

<Dialog.Root>
  <Dialog.Trigger class="btn variant-filled-primary">
    Open
  </Dialog.Trigger>
  <Dialog.Content class="card p-8">
    <Dialog.Title class="h3">Custom Dialog</Dialog.Title>
    <Dialog.Description>Fully custom styled</Dialog.Description>
  </Dialog.Content>
</Dialog.Root>
```

### When to Use Skeleton UI

- Using Skeleton design system
- Need pre-styled components
- Rapid prototyping
- Consistent visual language
- Dark mode out of the box

**Example**:
```svelte
<script lang="ts">
  import { Dialog } from '@skeletonlabs/skeleton';
</script>

<Dialog bind:open={isOpen}>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>Pre-styled Dialog</DialogHeader>
    <DialogBody>Uses Skeleton design tokens</DialogBody>
  </DialogContent>
</Dialog>
```

### Combining Systems

You can mix and match for optimal results:

```svelte
<script lang="ts">
  import { Dialog } from "bits-ui"; // Headless behavior
</script>

<Dialog.Root>
  <Dialog.Trigger class="btn preset-filled-primary-500">
    Open
  </Dialog.Trigger>
  <Dialog.Content class={[
    'card preset-filled-surface-50-900 p-8',
    'max-w-md rounded-xl shadow-xl'
  ]}>
    <Dialog.Title class="h3 text-primary-600-400">
      Hybrid Approach
    </Dialog.Title>
    <Dialog.Description class="text-surface-700-300">
      Bits UI behavior + Skeleton styling
    </Dialog.Description>
  </Dialog.Content>
</Dialog.Root>
```

## Design Workflow

### Step 1: Choose Component System

**Decision tree**:
1. Need interactive component? → Bits UI or Skeleton UI
2. Need full design control? → Bits UI
3. Using Skeleton design system? → Skeleton UI
4. Simple element (button, card)? → Tailwind + Skeleton tokens

### Step 2: Apply Design Tokens

Layer the design system:

1. **Base structure**: Component class or Skeleton component
2. **Preset styling**: Skeleton preset (`preset-filled-*`)
3. **Tailwind utilities**: Spacing, sizing, layout
4. **Dynamic values**: `style:` directive for CSS variables
5. **Conditional logic**: Svelte class composition
6. **Variants**: Hover, focus, responsive, dark mode

### Step 3: Ensure Accessibility

- Sufficient color contrast (WCAG AA/AAA)
- Focus-visible states for keyboard navigation
- Disabled states clearly indicated
- Semantic HTML with proper ARIA attributes

## Common Design Patterns

### Status-Based Borders

```svelte
<div class={[
  'block border-4 rounded-xl overflow-hidden',
  {
    'border-warning-600-400': status === 'pending',
    'border-primary-600-400': status === 'processing',
    'border-error-600-400': status === 'failed',
    'border-success-600-400': status === 'completed'
  }
]}>
  Content
</div>
```

### Interactive Cards with Bits UI

```svelte
<script lang="ts">
  import { Collapsible } from "bits-ui";
</script>

<Collapsible.Root>
  <Collapsible.Trigger class={[
    'card preset-filled-surface-50-900 p-4',
    'transition-all hover:shadow-lg hover:-translate-y-1',
    'w-full text-left'
  ]}>
    <h3 class="h4">Toggle Content</h3>
  </Collapsible.Trigger>
  <Collapsible.Content class="card preset-tonal-surface mt-2 p-4">
    <p>Hidden content</p>
  </Collapsible.Content>
</Collapsible.Root>
```

### Form with Skeleton UI

```svelte
<script lang="ts">
  import { Combobox } from '@skeletonlabs/skeleton';
  let selected = $state('');
</script>

<div class="card preset-filled-surface-50-900 p-6">
  <label class="label">
    <span class="text-sm font-semibold">Select Option</span>
    <Combobox bind:value={selected}>
      <ComboboxInput placeholder="Search..." />
      <ComboboxContent>
        <ComboboxItem value="1">Option 1</ComboboxItem>
        <ComboboxItem value="2">Option 2</ComboboxItem>
      </ComboboxContent>
    </Combobox>
  </label>
</div>
```

### Dynamic Styling with CSS Variables

```svelte
<script lang="ts">
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

### Dialog with Bits UI + Skeleton Styling

```svelte
<script lang="ts">
  import { Dialog } from "bits-ui";
</script>

<Dialog.Root>
  <Dialog.Trigger class="btn preset-filled-primary-500">
    Open Dialog
  </Dialog.Trigger>

  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 bg-black/50" />
    <Dialog.Content class={[
      'card preset-filled-surface-50-900',
      'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
      'max-w-md p-8 rounded-xl shadow-xl'
    ]}>
      <Dialog.Title class="h3 text-primary-600-400 mb-4">
        Confirmation
      </Dialog.Title>
      <Dialog.Description class="text-surface-700-300 mb-6">
        Are you sure you want to proceed?
      </Dialog.Description>
      <div class="flex gap-4 justify-end">
        <Dialog.Close class="btn preset-outlined-surface-500-400">
          Cancel
        </Dialog.Close>
        <button class="btn preset-filled-primary-500">
          Confirm
        </button>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

## Reference Documentation

This skill includes comprehensive reference documentation from all systems.

### Get Started

- `introduction.md` - Skeleton overview and philosophy
- `installation.md` - Framework-specific installation guides
- `fundamentals.md` - Core pillars: Design System, Tailwind Components
- `core-api.md` - @base, @theme, @utility, @variant layers

### Design System

- `themes.md` - Theme system and preset themes
- `colors-design.md` - Color palette structure and utilities
- `presets-design.md` - Built-in and custom preset patterns
- `typography-design.md` - Typography scale and semantic styles
- `spacing-design.md` - Dynamic spacing system
- `iconography.md` - Icon library recommendations

### Tailwind CSS

- `tailwind-utilities.md` - Tailwind CSS 4 utility classes
- `tailwind-colors.md` - OKLCH color system
- `tailwind-theme.md` - CSS-first @theme configuration
- `tailwind-variants.md` - State variants and conditional styling

### Skeleton Labs

- `svelte-class-syntax.md` - Svelte 5 class composition

### Tailwind Components (Basic Elements)

- `badges.md`, `buttons.md`, `cards.md`, `chips.md`
- `dividers.md`, `forms.md`, `placeholders.md`, `tables.md`

### Component Libraries

- `bits-ui-complete.md` - Complete Bits UI documentation (42 components)
- `skeleton-ui-complete.md` - Complete Skeleton UI documentation (27 components)

### Guides

- `dark-mode.md` - Dark mode strategies and color scheme
- `layouts.md` - Responsive layout patterns
- `cookbook.md` - Recipe collection for common UI features

### Migration

- `migrate-v2-to-v3.md` - v2 to v3 migration guide
- `migrate-v3-to-v4.md` - v3 to v4 migration guide

## Best Practices

### Component Library Selection

1. **Default to Bits UI for flexibility** - Easier to add styling than remove it
2. **Use Skeleton UI for rapid prototyping** - Pre-styled, consistent
3. **Mix strategically** - Bits UI behavior + Skeleton styling works well

### Composition Order

1. Base component class or Skeleton component
2. Skeleton preset (`preset-filled-*`)
3. Tailwind layout (`flex`, `grid`)
4. Tailwind spacing (`p-4`, `gap-2`)
5. CSS variable classes (`bg-(--custom-color)`)
6. Conditional classes (Svelte class syntax)
7. Interactive variants (`hover:`, `focus:`)
8. Responsive variants (`sm:`, `md:`)
9. Dark mode variants (`dark:`)

**Separate**: Use `style:` directive for dynamic CSS variable values

### Performance

- Use Svelte class arrays/objects over ternaries
- Prefer Skeleton presets over custom utility combinations
- Leverage Tailwind's JIT for minimal CSS output
- Use `@theme` for custom design tokens

### Maintainability

- Group related classes together
- Use Skeleton presets for consistent theming
- Document custom color tokens in `@theme`
- Test all states (hover, focus, disabled, dark mode)

### Accessibility

- Both Bits UI and Skeleton UI include full accessibility
- Always use `focus-visible:` for keyboard navigation
- Maintain WCAG contrast ratios
- Provide disabled states with `cursor-not-allowed`
- Test with keyboard-only navigation

## Quick Reference

### Tailwind CSS 4
- Utilities: `flex`, `grid`, `p-4`, `text-lg`, `bg-blue-500`
- Arbitrary values: `bg-(--color)`, `w-[var(--width)]`
- Variants: `hover:`, `dark:`, `data-*:`

### Skeleton Labs
- Presets: `preset-filled-primary-500`, `preset-tonal-surface`
- Colors: `bg-primary-600-400`, `text-surface-700-300`
- Components: `card`, `chip`, `badge`, `placeholder`

### Svelte 5
- Class object: `class={{ 'active': isActive }}`
- Class array: `class={['base', condition && 'extra']}`
- Style directive: `style:--color={value}`

### Bits UI (Headless)
- 42 components, completely unstyled
- Child snippet pattern for customization
- Full accessibility built-in

### Skeleton UI (Styled)
- 27 components, pre-styled
- Skeleton design token integration
- Zag.js-based behavior

## Integration with Svelte 5

This skill integrates seamlessly with Svelte 5 features:

- **Runes**: `$state`, `$derived`, `$props` for reactive styling
- **Snippets**: `{@render}` for reusable styled components
- **Effects**: `$effect` for dynamic class updates
- **TypeScript**: `ClassValue` type for prop definitions
- **Child Snippet**: Bits UI pattern for custom rendering

---

**Complete unified design system for Svelte 5**: Tailwind CSS 4 utilities + Skeleton Labs tokens + Bits UI headless components + Skeleton UI styled components + Svelte 5 class syntax = Maximum flexibility and productivity.
