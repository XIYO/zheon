# Bits UI Component Index

Quick reference for all Bits UI components, utilities, and documentation sections.

## General Documentation

- Introduction
- Getting Started
- Child Snippet
- Dates and Times
- LLMs
- Ref
- State Management
- Styling
- Transitions

## Components (42)

### Layout & Structure
- Accordion - Vertically stacked collapsible sections
- Aspect Ratio - Fixed aspect ratio container
- Collapsible - Simple expand/collapse
- Scroll Area - Custom scrollbar styling
- Separator - Visual divider
- Tabs - Layered content sections

### Overlays & Dialogs
- Alert Dialog - Modal with required action
- Context Menu - Right-click menu
- Dialog - Modal dialog overlay
- Link Preview - Hover preview
- Popover - Floating content
- Tooltip - Contextual information

### Forms & Inputs
- Button - Interactive button
- Checkbox - Boolean input
- Label - Form label
- PIN Input - PIN code entry
- Radio Group - Mutually exclusive options
- Slider - Numeric range input
- Switch - Toggle switch
- Toggle - Pressable on/off button
- Toggle Group - Multiple toggle selection

### Selection & Navigation
- Combobox - Autocomplete input
- Command - Command palette
- Dropdown Menu - Action menu
- Menubar - Horizontal menu navigation
- Navigation Menu - Site navigation
- Pagination - Page navigation
- Select - Dropdown selection
- Toolbar - Tool collection

### Date & Time
- Calendar - Date selection
- Date Field - Date text input
- Date Picker - Calendar popup
- Date Range Field - Date range input
- Date Range Picker - Date range with calendar
- Range Calendar - Date range selection
- Time Field - Time text input
- Time Range Field - Time range input

### Feedback & Status
- Meter - Measurement display
- Progress - Progress indicator
- Rating Group - Star rating

### Media & Content
- Avatar - User profile image

## Utilities (5)

- BitsConfig - Global configuration
- IsUsingKeyboard - Keyboard usage detection
- mergeProps - Merge prop objects
- Portal - Render in different DOM location
- useId - Generate unique IDs

## Type Helpers (4)

- WithElementRef - Add element ref to props
- WithoutChild - Exclude child snippet
- WithoutChildren - Exclude children
- WithoutChildrenOrChild - Exclude both

## Quick Search Tips

Search complete-docs.md for specific components:

```bash
# Find Dialog documentation
grep -A 50 "^# Dialog Documentation" references/complete-docs.md

# Find all components with "Menu"
grep "Menu Documentation" references/complete-docs.md

# Find date-related components
grep -i "date.*Documentation" references/complete-docs.md
```
