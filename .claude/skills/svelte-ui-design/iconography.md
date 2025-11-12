# Iconography

Skeleton takes an agnostic approach to icons.

## Overview

Developers can use SVGs, emoji, unicode, or dedicated icon libraries in any combination.

## Lucide (Recommended)

Skeleton recommends [Lucide](https://lucide.dev/) as the primary icon solution. This library offers:

- Extensive icon selection
- Support across popular frameworks
- Clean, modern aesthetic
- Used throughout Skeleton's documentation

### Installation

**Svelte:** Follow [Lucide for Svelte official instructions](https://lucide.dev/guide/packages/lucide-svelte)

**React:** Follow [Lucide for React official instructions](https://lucide.dev/guide/packages/lucide-react)

### Code Examples

**Svelte:**

```svelte
<script>
	import { SkullIcon } from '@lucide/svelte';
</script>

<SkullIcon stroke="pink" class="size-8" />
```

**React:**

```tsx
import { SkullIcon } from 'lucide-react';

export default function App() {
	return <SkullIcon stroke="pink" className="size-8" />;
}
```

## Alternative Icon Libraries

- **Iconify**: Vast collection of icon sets from popular libraries
- **Font Awesome**: Large free tier offering
- **SimpleIcons**: Excellent brand icon selection
- **Radix Icons**: Modern styles (React only)
- **HeroIcons**: Created by Tailwind CSS team (React/Vue)
