# Layouts

This guide teaches responsive layout creation using semantic HTML and Tailwind CSS. The techniques work across Skeleton-supported frameworks since they use native HTML and Tailwind utilities.

## Semantic HTML Elements

| Element     | Purpose                                                                           |
| ----------- | --------------------------------------------------------------------------------- |
| `<header>`  | Introductory content, typically a group of introductory or navigational aids      |
| `<main>`    | Dominant content within the document directly related to the page's central topic |
| `<footer>`  | Footer for its nearest ancestor sectioning content with author/copyright info     |
| `<aside>`   | Portion of a document whose content is only indirectly related to main content    |
| `<article>` | Self-contained composition intended to be independently distributable             |

## Body Scroll Priority

Use `<body>` as the scrollable element to avoid:

- Mobile "pull to refresh" breaking
- Mobile Safari interface not auto-hiding
- Print style issues
- Accessibility problems on touch devices
- Framework layout inconsistencies

## Key Tailwind Utilities

### Grid Control

Columns, rows, gaps, auto-flow, column/row positioning

### Alignment

Justify/align content, items, self properties for both flexbox and grid

### Responsive Design

Built-in breakpoints (e.g., `md:` prefix for medium screens and up)

## Layout Patterns

- **One Column**: Simple stacked layout
- **Two Column**: Header, sidebar + main content, footer
- **Three Column**: Header, left sidebar, main, right sidebar, footer

## Sticky Elements

### Sticky Header

Use `sticky top-0 z-10` classes; optionally add `backdrop-blur` for glass effect

### Sticky Sidebar

Apply `col-span-1 h-screen` with explicit grid column definitions

## Advanced Techniques

- **Calculate Offsets**: Use `calc()` for dynamic sizing (e.g., `h-[calc(100vh-100px)]`)
- **Smart Grid Rows**: Combine grid with `minmax()` for flexible column widths
- **Grid Template**: Native CSS `grid-template` offers declarative layout shortcuts
