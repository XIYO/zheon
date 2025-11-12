# Forms and Inputs

Form and input styling utilities within Skeleton UI.

## Prerequisites

### Tailwind Forms Plugin

Skeleton requires the official `@tailwindcss/forms` plugin for normalized form styling.

**Installation:**

```sh
npm install -D @tailwindcss/forms
```

**Implementation in global stylesheet:**

```css
@import 'tailwindcss';
@plugin '@tailwindcss/forms';
```

### Browser Support

The quality and appearance of native and semantic HTML form elements can vary between both operating systems and browser vendors.

## Form Elements

### Inputs

Supports all standard HTML input types: text, password, email, URL, telephone, search, and number.

**Example structure:**

```html
<label class="label">
	<span class="label-text">Input</span>
	<input class="input" type="text" placeholder="Input" />
</label>
```

### Select Dropdowns

Native select elements with Skeleton styling:

```html
<select class="select">
	<option value="1">Option 1</option>
	<option value="2">Option 2</option>
</select>
```

### Checkboxes

Display checkbox inputs with accompanying labels using flex layout and spacing utilities.

### Radio Groups

Grouped radio buttons with consistent styling and naming conventions.

### Kitchen Sink Elements

Includes date pickers, file inputs, range sliders, progress elements, and color inputs.

## Input Groups

Input groups combine multiple form elements into cohesive units. They support:

### Classes

- `input-group` - Parent container
- `ig-cell` - Text/icon cells
- `ig-input` - Text inputs
- `ig-select` - Select elements
- `ig-btn` - Buttons

**Example with prefix/suffix:**

```html
<div class="input-group grid-cols-[auto_1fr_auto]">
	<div class="ig-cell preset-tonal">https://</div>
	<input class="ig-input" type="text" />
</div>
```

## Resources

- **Source**: [GitHub Repository](https://github.com/skeletonlabs/skeleton/tree/main/packages/skeleton/src/utilities/)
- **Tailwind Forms Plugin**: [Official Repository](https://github.com/tailwindlabs/tailwindcss-forms)
