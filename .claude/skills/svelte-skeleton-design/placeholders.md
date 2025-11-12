# Placeholders

Provides skeleton loading states for content that's being fetched.

## Overview

- **Purpose**: Provides 'skeleton' placeholders that can display while content loads
- **Source**: Available in Skeleton GitHub repository under utilities/placeholders.css
- Framework-agnostic utility classes built on Tailwind CSS

## Available Styles

Several preset options:

- Surface background variant
- Primary, secondary, and tertiary filled presets
- Success, warning, and error state presets
- Linear gradient combinations (primary-to-secondary, secondary-to-tertiary, tertiary-to-primary)

## Basic Usage

The primary implementation pattern uses the `placeholder` class with Tailwind's animation utilities:

```html
<div class="placeholder animate-pulse">...</div>
```

## Circular Placeholders

For avatar-like loading states:

```html
<div class="placeholder-circle size-16 animate-pulse"></div>
```

## Implementation Example

A complete skeleton layout combines multiple placeholders with spacing utilities to create realistic loading compositions for complex UI sections.

## Related Components

- Forms
- Tables
- Badges
- Other Tailwind components
