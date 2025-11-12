# Tables

Skeleton provides styling for native HTML table elements.

## Basic Table Example

A simple table structure using the `.table` class with row hover effects:

```html
<div class="table-wrap">
	<table class="table caption-bottom">
		<tbody class="[&>tr]:hover:preset-tonal-primary">
			<!-- table rows -->
		</tbody>
	</table>
</div>
```

## Extended Features

### With Headers, Footers & Captions

Tables can include `<caption>`, `<thead>`, and `<tfoot>` elements for comprehensive table structures.

### Navigation Patterns

Native HTML tables do not support interaction. For accessibility, use anchors or buttons within the last cell. This enables clickable rows with action buttons.

## Styling Options

- **Hover Effects**: Apply `.hover:preset-tonal-primary` to tbody rows for visual feedback
- **Layout Control**: Tailwind's table layout utilities adjust the algorithm
- **Alignment**: Use text utilities like `text-right` for column alignment

## Integration

Tables pair with the Pagination component for managing large datasets, providing a complete data presentation solution.

## Source

[GitHub Repository](https://github.com/skeletonlabs/skeleton/tree/main/packages/skeleton/src/utilities/tables.css)
