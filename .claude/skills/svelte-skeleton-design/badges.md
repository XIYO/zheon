# Badges

Provides a robust set of non-interactive badge styles.

## Basic Usage

Badges can be implemented as simple spans with the `.badge` class. Three variations:

- Icon-only badges using `.badge-icon`
- Text-only badges
- Combined icon and text badges

## Preset Styles

The component supports multiple visual presets across seven color categories:

- Primary, Secondary, Tertiary
- Success, Warning, Error
- Surface

Each color offers three style variants:

- **Filled**: solid background
- **Tonal**: lighter background with colored text
- **Outlined**: border-based styling

## Overlap Technique

For notification-style badges overlaying other elements, use `.badge-icon` with absolute positioning. Example: numeric indicator positioned over an avatar image.

## Technical Details

- **Source**: Located in Skeleton GitHub repository's utilities/badges.css
- **Framework**: Works with Astro, compatible with Svelte and React variants
- **Presets**: Full integration with Skeleton's preset system for consistent theming

Badges are purely presentational components without interactive functionality.
