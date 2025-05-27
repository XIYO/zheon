---
applyTo: '**/*.svelte'
---

# Design System & Style Guidelines

no transitions, no animations

## Core Design Philosophy
- **Minimalist & Modern**: Clean, uncluttered interfaces with purposeful design elements
- **Dark Theme Primary**: Black (#000000) as the primary background for headers and navigation
- **Monochromatic Elegance**: Sophisticated grayscale palette with strategic use of white and gray tones

## Color Palette
- **Primary Background**: `bg-black` - Deep black for headers and primary surfaces
- **Text Colors**: 
  - Primary: `text-white` - Pure white for primary text on dark backgrounds
  - Secondary: `text-gray-300` - Muted gray for secondary information
  - Subtle: `text-gray-600` - Darker gray for less prominent elements
- **Interactive Elements**:
  - Neutral surfaces: `bg-gray-50`, `bg-gray-200`
  - Hover states: `hover:bg-gray-300`, `hover:text-white`
- **Backdrop**: `backdrop:bg-black/30` - Semi-transparent black for modal overlays

## Typography
- **Logo/Branding**: `text-xl font-extrabold tracking-widest` - Bold, spaced lettering for brand identity
- **Body Text**: `text-sm` - Consistent small text size for readability
- **Hierarchy**: Use font-weight and color variations rather than size changes

## Layout & Spacing
- **Header**: `sticky top-0 z-50` - Always visible navigation
- **Padding**: Consistent `px-6 py-4` for header elements, `p-4` for modal content
- **Spacing**: `space-x-6` for navigation items, `ml-4` for related elements
- **Max Width**: `max-w-md` for modal dialogs to maintain focus

## Interactive Elements
- **Buttons**: 
  - Rounded corners: `rounded-md`, `rounded-lg`
  - Consistent padding: `px-3 py-1` for small buttons
- **Links**: 
  - Underline on hover: `hover:underline`
  - Offset underlines: `underline-offset-4`
  - Color changes on hover

## Component Patterns
- **Modal Dialogs**:
  - Centered: `m-auto`
  - Rounded: `rounded-lg`
  - Semi-transparent backdrop
  - Close button in top-right with consistent styling
- **Forms**:
  - Clean, minimal form styling
  - Consistent button treatments
  - Clear visual hierarchy

## Visual Effects
- **Shadows**: `shadow-md` for elevated elements like headers
- **Hover States**: Subtle color changes, never jarring changes
- **Focus States**: Maintain accessibility with clear focus indicators

## Responsiveness
- **Flexible Layouts**: Use flexbox (`flex items-center justify-between`)
- **Consistent Breakpoints**: Follow Tailwind's responsive design patterns
- **Mobile-First**: Ensure all interactions work on touch devices

## Accessibility
- **Semantic HTML**: Use proper semantic elements (`<header>`, `<nav>`, `<dialog>`)
- **Color Contrast**: Ensure sufficient contrast between text and backgrounds
- **Focus Management**: Proper focus handling for modals and interactive elements
- **Keyboard Navigation**: All interactive elements must be keyboard accessible

## Content Guidelines
- **Bilingual Support**: Korean and English text coexistence
- **Concise Copy**: Short, clear labels and messages
- **Consistent Terminology**: Use consistent terms across the interface
