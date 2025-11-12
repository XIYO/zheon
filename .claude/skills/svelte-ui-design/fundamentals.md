# Fundamentals

Skeleton is a comprehensive UI toolkit built on Tailwind CSS with three core pillars.

## Three Core Pillars

### Design System

The design system includes themes, color systems, presets, typography, spacing, and iconography guidance for creating cohesive interfaces.

### Tailwind Components

Primitive UI elements provided as Tailwind utilities, including:

- Badges
- Buttons
- Cards
- Chips
- Dividers
- Forms
- Placeholders
- Tables

### Framework Components

Granular, composable components available for:

- React (`@skeletonlabs/skeleton-react`)
- Svelte (`@skeletonlabs/skeleton-svelte`)

Built on **Zag.js**, a framework-agnostic state management library maintained by industry veterans including Chakra UI's creator.

## Key Features

### Composed Pattern

Components are granular, allowing direct access to child elements and custom attributes like `data-*`, `style`, and `className`/`class`.

### Styling Convention

Components accept CSS utilities via `className` (React) or `class` (Svelte) attributes with automatic precedence handling through `@base` layer assignment.

### Extensible Markup

Advanced users can override internal HTML using the `element` prop/snippet to pass custom elements with spread attributes.

### Custom Animations

The extensible pattern supports animation libraries:

- Motion
- Svelte Transitions
- Anime.js
- Animate.css

### Provider Pattern

Many components support provider patterns for programmatic control, enabling features like toggling overlay visibility or clearing inputs through Zag.js APIs.
