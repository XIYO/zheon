---
name: bits-ui
description: Comprehensive guide for Bits UI, a headless component library for Svelte. Provides full documentation for all 42 components, utilities, type helpers, styling approaches, accessibility patterns, and state management. Use this skill when building UI components with Bits UI.
---

# Bits UI

## Overview

Bits UI is a headless component library for Svelte focused on developer experience, accessibility, and full creative control. This skill provides complete guidance for using all Bits UI components, utilities, and patterns.

Use this skill when:

- Building UI components with Bits UI
- Implementing accessible headless components
- Customizing component behavior and styling
- Working with date/time components
- Managing component state and events
- Implementing keyboard navigation and ARIA patterns
- Using advanced patterns like child snippets and render delegation

## Quick Start

### Installation

```bash
bun add bits-ui
```

### Basic Usage

```svelte
<script lang="ts">
  import { Accordion } from "bits-ui";
</script>

<Accordion.Root>
  <Accordion.Item value="item-1">
    <Accordion.Header>
      <Accordion.Trigger>Trigger</Accordion.Trigger>
    </Accordion.Header>
    <Accordion.Content>Content</Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
```

---

## Core Concepts

### Headless Components

Bits UI components ship completely unstyled, giving you full control over appearance while maintaining accessibility and functionality.

### Styling Approaches

Three main approaches:
- **CSS Frameworks**: TailwindCSS, UnoCSS via `class` props
- **Data Attributes**: Reliable selectors via `data-*` attributes
- **Scoped Styles**: Child snippets for inline/scoped styles

### Child Snippet Pattern

Use the `child` snippet for complete control over rendered elements:

```svelte
<Accordion.Trigger>
  {#snippet child({ props })}
    <MyCustomButton {...props}>Open</MyCustomButton>
  {/snippet}
</Accordion.Trigger>
```

### State Management

- **Two-way binding**: `bind:open`, `bind:value`
- **Function bindings**: `onOpenChange={(open) => handleOpen(open)}`
- **Controlled state**: External state management

### Accessibility

All components include:
- WAI-ARIA compliance
- Keyboard navigation by default
- Focus management
- Screen reader support

---

## Components

### Layout & Structure

**Accordion** - Vertically stacked sections with collapsible content
- Root, Item, Header, Trigger, Content components
- Single or multiple expansion modes
- Keyboard navigation built-in

**Collapsible** - Simple expand/collapse container
- Root, Trigger, Content components
- Controlled or uncontrolled state

**Tabs** - Layered content sections
- Root, List, Trigger, Content components
- Keyboard navigation, ARIA roles

**Separator** - Visual divider
- Horizontal or vertical orientation
- ARIA separator role

**Aspect Ratio** - Container with fixed aspect ratio
- Maintains aspect ratio across screen sizes

**Scroll Area** - Custom scrollbar styling
- Viewport, Scrollbar, Thumb components
- Cross-browser consistency

---

### Overlays & Dialogs

**Dialog** - Modal dialog overlay
- Root, Trigger, Portal, Overlay, Content, Title, Description, Close
- Focus trapping and scroll locking
- Close on outside click/escape

**Alert Dialog** - Interrupts user with important message
- Similar API to Dialog
- Required user action
- No close on outside click by default

**Popover** - Floating content container
- Root, Trigger, Content components
- Positioning and collision detection
- Arrow support

**Tooltip** - Contextual information on hover
- Root, Trigger, Content components
- Delay controls
- Keyboard accessible

**Link Preview** - Preview content on hover
- Root, Trigger, Content components
- Delay and positioning

**Context Menu** - Right-click menu
- Root, Trigger, Content, Item, Separator, Checkbox Item, Radio Group, Sub
- Nested menus
- Keyboard navigation

---

### Forms & Inputs

**Button** - Interactive button element
- Accessible button with loading states
- Disabled state handling

**Checkbox** - Boolean input
- Root, Input, Indicator components
- Controlled or uncontrolled
- Indeterminate state

**Radio Group** - Mutually exclusive options
- Root, Item, Input, Indicator components
- Keyboard navigation
- ARIA radio group

**Switch** - Toggle switch
- Root, Input, Thumb components
- On/off states

**Toggle** - Pressable on/off button
- Single toggle component
- ARIA pressed state

**Toggle Group** - Multiple or single toggle selection
- Root, Item components
- Single or multiple selection

**Slider** - Numeric range input
- Root, Range, Thumb, Tick components
- Single or multi-thumb
- Step and min/max values

**PIN Input** - PIN code input
- Root, Input components
- Auto-focus and navigation
- Paste support

**Label** - Form label
- Automatic association with inputs
- Click to focus

---

### Selection & Navigation

**Select** - Dropdown selection
- Root, Trigger, Portal, Content, Item, Group, Label, Separator
- Keyboard navigation
- Type-ahead search
- Scrollable lists

**Combobox** - Autocomplete input
- Root, Input, Content, Item, Group
- Filtering and search
- Keyboard navigation

**Command** - Command palette interface
- Root, Input, List, Item, Group, Separator
- Keyboard shortcuts
- Fast filtering

**Dropdown Menu** - Action menu
- Root, Trigger, Content, Item, Separator, Checkbox Item, Radio Group, Sub
- Nested menus
- Keyboard navigation

**Menubar** - Horizontal menu navigation
- Root, Menu, Trigger, Content, Item, Separator, Checkbox Item, Radio Group, Sub
- Desktop application style
- Keyboard navigation

**Navigation Menu** - Site navigation
- Root, List, Item, Trigger, Content, Link, Viewport
- Hover and click interactions
- Nested menus

**Pagination** - Page navigation
- Root, Page, Previous, Next components
- Current page tracking
- Customizable ranges

**Toolbar** - Tool collection
- Root, Group, Button, Link, Separator
- Roving focus

---

### Date & Time

**Calendar** - Date selection
- Root, Header, Heading, Grid, Cell, Day components
- Single or multiple date selection
- Date ranges
- Disabled dates

**Date Field** - Date text input
- Root, Input, Segment, Label components
- Formatted date entry
- Keyboard navigation

**Date Picker** - Calendar popup for date selection
- Combines Date Field + Calendar
- Input, Calendar, Content components

**Date Range Field** - Date range text input
- Start and end date segments
- Validation

**Date Range Picker** - Date range selection with calendar
- Combines Date Range Field + Range Calendar

**Range Calendar** - Date range selection calendar
- Similar to Calendar
- Range selection mode

**Time Field** - Time text input
- Root, Input, Segment, Label components
- Hour, minute, second segments

**Time Range Field** - Time range input
- Start and end time segments

---

### Feedback & Status

**Progress** - Progress indicator
- Root component
- Determinate or indeterminate
- Value and max props

**Meter** - Measurement display
- Root component
- Value, min, max, optimum

**Rating Group** - Star rating input
- Root, Item components
- Readonly or interactive
- Custom icons

---

### Media & Content

**Avatar** - User profile image
- Root, Image, Fallback components
- Automatic fallback
- Loading states

---

## Utilities

**mergeProps** - Merge prop objects intelligently
```typescript
import { mergeProps } from "bits-ui";
const merged = mergeProps(props1, props2);
```

**Portal** - Render content in different DOM location
```svelte
<Portal to="body">
  <div>Rendered in body</div>
</Portal>
```

**useId** - Generate unique IDs
```typescript
import { useId } from "bits-ui";
const id = useId();
```

**IsUsingKeyboard** - Detect keyboard usage
```typescript
import { IsUsingKeyboard } from "bits-ui";
const isKeyboard = IsUsingKeyboard.getStore();
```

**BitsConfig** - Global configuration
```svelte
<BitsConfig portal="body">
  {children}
</BitsConfig>
```

---

## Type Helpers

**WithElementRef** - Add element ref to component props
**WithoutChild** - Exclude child snippet from props
**WithoutChildren** - Exclude children from props
**WithoutChildrenOrChild** - Exclude both children and child snippet

---

## Advanced Patterns

### Render Delegation with Child Snippet

Complete control over rendered elements while maintaining accessibility:

```svelte
<Dialog.Trigger>
  {#snippet child({ props })}
    <button {...props} class="custom-button">
      Open Dialog
    </button>
  {/snippet}
</Dialog.Trigger>
```

### Transitions

Use Svelte transitions with child snippets:

```svelte
<Dialog.Content>
  {#snippet child({ props, open })}
    <div {...props}>
      {#if open}
        <div transition:fade>Content</div>
      {/if}
    </div>
  {/snippet}
</Dialog.Content>
```

### State Management

Multiple approaches for state control:

```svelte
<script lang="ts">
  // Uncontrolled
  let open = $state(false);
</script>

<Dialog.Root bind:open>
  <!-- ... -->
</Dialog.Root>

<!-- Controlled with function -->
<Dialog.Root onOpenChange={(o) => open = o}>
  <!-- ... -->
</Dialog.Root>
```

### Date Values

Using `@internationalized/date`:

```svelte
<script lang="ts">
  import { CalendarDate } from "@internationalized/date";

  let value = $state(new CalendarDate(2024, 1, 1));
</script>

<DatePicker.Root bind:value>
  <!-- ... -->
</DatePicker.Root>
```

---

## Complete Documentation Reference

For detailed API documentation, examples, and usage patterns for all components, see:

**references/complete-docs.md** - Complete Bits UI LLM documentation

Load this when:
- Need detailed API reference for specific component
- Looking for advanced usage examples
- Understanding component props and events
- Implementing complex component compositions
- Troubleshooting component behavior

---

## Resources

**Official Documentation**: https://bits-ui.com/docs
**GitHub**: https://github.com/huntabyte/bits-ui
**LLM Docs**: https://bits-ui.com/docs/llms.txt

---

## Best Practices

### Styling

Use data attributes for state-based styling:

```svelte
<style>
  [data-state="open"] { /* ... */ }
  [data-state="closed"] { /* ... */ }
  [data-disabled] { /* ... */ }
</style>
```

### Accessibility

- Always provide labels for form inputs
- Use Description components for additional context
- Test keyboard navigation
- Verify screen reader announcements

### Performance

- Use Portal for overlay components to avoid stacking context issues
- Lazy load heavy components
- Consider using child snippets for conditional rendering

### TypeScript

All components have full TypeScript support:

```svelte
<script lang="ts">
  import type { AccordionRootProps } from "bits-ui";

  let props: AccordionRootProps = {
    value: "item-1",
    type: "single"
  };
</script>
```
