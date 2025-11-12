# Migrate from v3 to v4

Skeleton v4 represents a complete overhaul of component APIs, aiming to stabilize the internal and external APIs and make components more intuitive for new users.

## Prerequisites

- Create a dedicated feature branch for migration work
- Update both Skeleton packages to latest v3.x version
- Update critical dependencies to their latest versions
- Ensure your app is tested and functional

## Automated Migration

Run the CLI command:

```bash
npx skeleton migrate skeleton-4
```

This handles package and stylesheet updates automatically.

## Package Updates

**React:**

```bash
npm install @skeletonlabs/skeleton@latest @skeletonlabs/skeleton-react@latest
```

**Svelte:**

```bash
npm install @skeletonlabs/skeleton@latest @skeletonlabs/skeleton-svelte@latest
```

## Stylesheet Changes

Replace old `@source` rules with new `@import` syntax:

```css
@import '@skeletonlabs/skeleton-{framework}';
```

Remove the optional presets import if present, as these are now included in the core package.

## Component Migration Example

**Avatar (v3):**

```svelte
<Avatar src="https://i.pravatar.cc/150?img=48" name="Jane Doe" />
```

**Avatar (v4):**

```svelte
<Avatar>
	<Avatar.Image src="https://i.pravatar.cc/150?img=48" alt="Jane Doe" />
	<Avatar.Fallback>SK</Avatar.Fallback>
</Avatar>
```

## Component Renames

| v3                  | v4                           |
| ------------------- | ---------------------------- |
| `<Modal>`           | `<Dialog>`                   |
| `<Navigation.Bar>`  | `<Navigation layout="bar">`  |
| `<Navigation.Rail>` | `<Navigation layout="rail">` |
| `<ProgressRing>`    | `<Progress>`                 |
| `<Ratings>`         | `<RatingGroup>`              |
| `<Segment>`         | `<SegmentedControl>`         |
| `<Toaster>`         | `<Toast.Group>`              |

## Migration Tips

- Search your project by v3 component names to locate all instances
- Comment out components, then enable them one-by-one as you update
- Consult individual component documentation during migration

## Support

Contact the Skeleton team via Discord (#contributors channel) or GitHub discussions for migration assistance.
