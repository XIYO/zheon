---
name: svelte-ui-design
description: ALWAYS use this skill for ANY Svelte component styling, design, or UI work. Complete Svelte 5 UI design system including Tailwind CSS 4, Skeleton Labs design tokens, Bits UI headless components, and Skeleton UI component library. Covers class composition, color systems, interactive components, forms, overlays, and all visual design. Use for any design, styling, or component work in Svelte projects.
---

# Svelte UI Design System

Svelte 5 + Tailwind CSS 4 + Skeleton Labs + Bits UI + Skeleton UI 통합 디자인 시스템

## Core Systems

### 1. Tailwind CSS 4
유틸리티 우선 CSS 프레임워크. 레이아웃, 간격, 타이포그래피, 반응형 디자인.

**참고**: `tailwind-utilities.md`, `tailwind-colors.md`, `tailwind-theme.md`, `tailwind-variants.md`

### 2. Skeleton Labs
디자인 토큰, 프리셋, 색상 시스템. Presets와 Color Pairings는 반드시 문서 참고.

**참고**: `colors-design.md`, `presets-design.md`, `themes.md`, `typography-design.md`, `spacing-design.md`

### 3. Svelte 5 Class Syntax
객체/배열 기반 클래스 조합, `style:` 디렉티브.

**참고**: `svelte-class-syntax.md`

### 4. Bits UI - Headless Components (42개)
완전히 커스터마이징 가능한 unstyled 컴포넌트. 최대한의 디자인 제어 필요 시 사용.

**주요 컴포넌트**:
- **Layout**: Accordion, Collapsible, Tabs, Separator
- **Overlays**: Dialog, Popover, Tooltip, Context Menu, Drawer
- **Forms**: Checkbox, Radio Group, Switch, Slider, Select, Combobox
- **Date/Time**: Calendar, Date Picker, Date Range Picker, Time Field
- **Navigation**: Dropdown Menu, Menubar, Navigation Menu, Pagination
- **Display**: Avatar, Progress, Meter, Badge
- **Interactive**: Button, Toggle, Link Preview

**참고**: `bits-ui-complete.md`

### 5. Skeleton UI - Styled Components (27개)
Skeleton 디자인 시스템이 적용된 pre-styled 컴포넌트. 빠른 개발 시 사용.

**주요 컴포넌트**:
- **Layout**: App Bar, Navigation, Tabs, Pagination
- **Disclosure**: Accordion, Collapsible
- **Overlays**: Dialog, Popover, Tooltip, Toast
- **Forms**: Combobox, Date Picker, File Upload, Slider, Switch, Tags Input
- **Display**: Avatar, Progress (Circular/Linear), Tree View, Breadcrumb

**참고**: `skeleton-ui-complete.md`

## Component Selection

| 상황 | 선택 |
|------|------|
| 완전한 디자인 제어 필요 | Bits UI |
| Skeleton 디자인 시스템 사용 | Skeleton UI |
| 빠른 프로토타이핑 | Skeleton UI |
| 커스텀 디자인 시스템 | Bits UI + Tailwind |

## Tailwind Components (Basic Elements)

간단한 UI 요소. Skeleton 프리셋 + Tailwind 유틸리티 조합.

**참고**: `badges.md`, `buttons.md`, `cards.md`, `chips.md`, `dividers.md`, `forms.md`, `placeholders.md`, `tables.md`

## Quick Reference

### Skeleton Labs 중요 규칙
- **Color Pairings**: 반드시 `colors-design.md` 참고
- **Presets**: 반드시 `presets-design.md` 참고
- 직접 shade 조합을 만들지 말고 문서에 명시된 조합만 사용

### Svelte 5 Class
```svelte
class={['base', condition && 'extra']}
class={{ 'active': isActive }}
style:--color={dynamicValue}
```

### 다크 모드
`dark-mode.md` 참고

### 레이아웃
`layouts.md` 참고

### 마이그레이션
`migrate-v2-to-v3.md`, `migrate-v3-to-v4.md` 참고

## Available Documentation

### Get Started
- `introduction.md` - Skeleton 개요
- `installation.md` - 프레임워크별 설치
- `fundamentals.md` - 핵심 개념
- `core-api.md` - @base, @theme, @utility, @variant

### Design System
- `themes.md` - 테마 시스템
- `colors-design.md` - 색상 팔레트 및 Color Pairings
- `presets-design.md` - 프리셋 시스템
- `typography-design.md` - 타이포그래피
- `spacing-design.md` - 간격 시스템
- `iconography.md` - 아이콘

### Tailwind CSS
- `tailwind-utilities.md` - Tailwind CSS 4 유틸리티
- `tailwind-colors.md` - OKLCH 색상
- `tailwind-theme.md` - CSS @theme 설정
- `tailwind-variants.md` - 상태 variant

### Svelte 5
- `svelte-class-syntax.md` - 클래스 조합

### Tailwind Components
- `badges.md`, `buttons.md`, `cards.md`, `chips.md`
- `dividers.md`, `forms.md`, `placeholders.md`, `tables.md`

### Component Libraries
- `bits-ui-complete.md` - Bits UI 42개 컴포넌트 완전 문서
- `skeleton-ui-complete.md` - Skeleton UI 27개 컴포넌트 완전 문서

### Guides
- `dark-mode.md` - 다크 모드
- `layouts.md` - 레이아웃
- `cookbook.md` - 레시피

### Migration
- `migrate-v2-to-v3.md` - v2 → v3
- `migrate-v3-to-v4.md` - v3 → v4

## Best Practices

1. **Skeleton 색상/프리셋**: 반드시 공식 문서(`colors-design.md`, `presets-design.md`)에서 확인
2. **Component 선택**: Bits UI (유연성) vs Skeleton UI (일관성)
3. **Class 조합 순서**: 베이스 → 프리셋 → 레이아웃 → 간격 → 조건부 → variant
4. **접근성**: WCAG 대비 비율, focus-visible 상태
5. **성능**: Svelte class 배열/객체 사용, Skeleton 프리셋 활용
