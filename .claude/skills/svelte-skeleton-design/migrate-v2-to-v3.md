# Migrate from v2 to v3

This guide documents the migration path from Skeleton v2 to v3, a major overhaul requiring both automated and manual updates.

## Prerequisites

- Running latest Skeleton v2.x
- Updated critical dependencies
- Functional app state
- Create a dedicated migration branch: `git checkout -b migration`

## Core Technology Migrations

Three foundational technologies require updates before Skeleton-specific changes:

### Svelte v5

Migrate to the latest release of Svelte v5 using their official migration guide.

### SvelteKit v2

Update to the latest SvelteKit v2 release following their migration documentation.

### Tailwind v4

Before upgrading, manually:

1. Remove `skeleton` plugin from `tailwind.config`
2. Rename `app.postcss`/`app.pcss` to `app.css`
3. Remove `vite-plugin-tailwind-purgecss` from Vite config

## Tailwind Vite Plugin Migration

Replace PostCSS with Vite plugin:

```bash
npm uninstall postcss @tailwindcss/postcss
npm install @tailwindcss/vite
```

Update `vite.config`:

```typescript
import tailwindcss from '@tailwindcss/vite';

plugins: [tailwindcss(), sveltekit()];
```

## Automated Migration CLI

```bash
npx skeleton migrate skeleton-3
```

**Handles:**

- Dependencies
- Imports
- Theme data attributes
- Utility classes
- Component names

**Doesn't handle:**

- Component props
- Most v2 utilities

## Manual Migration Steps

### Themes

- **Preset themes:** Auto-migrated
- **Custom themes:** Use Theme Generator's import feature, convert v2 theme format, register theme

### Component Changes

Major renaming patterns:

- `RangeSlider` → `Slider`
- `Slider` (toggle) → `Switch`
- `TabGroup` → `Tabs`
- `InputChip` → `TagsInput`
- `AppRail` → `Navigation`
- `FileButton`/`FileDropzone` → `FileUpload`

Key technical shifts include adopting Svelte 5 runes, Zag.js integration, and new component fundamentals.

### CSS Updates

Replace `@apply` with CSS custom properties:

```css
/* Instead of: @apply bg-surface-50-950 p-4; */
background-color: var(--color-surface-50-950);
padding: --spacing(4);
```

### Removed Features with Alternatives

- `<AppShell>` → custom layouts
- `<Lightswitch>` → custom component
- Code blocks → integration guide
- Drawers/Modals/Popups → `<Dialog>`/`<Popover>` components
- Persisted stores → incompatible with Svelte 5

## Class Migrations

- `input-group-shim` → `ig-cell`
- `input-group > input` → `ig-input`
- `input-group-divider` → removed

## Verification

Test your app locally after completing all steps:

```bash
npm run dev
```

Consult component documentation for specific prop changes and usage examples throughout the process.
