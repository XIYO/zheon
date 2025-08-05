## Design Memories

- Comprehensive color scheme and styling example with preset button styles including filled, tonal, outlined, glass, elevated, ghost, icon, and gradient variations
- Demonstrates flexible grid layout with responsive design for different button types
- Uses custom CSS classes for preset color schemes across neutral, primary, secondary, tertiary, success, warning, error, and surface colors
- Includes custom gradient and glass effect implementations using CSS variables and color mixing

# Skeleton UI Styling Guidelines

Use ONLY these Skeleton presets. Keep basic design minimal. Apply varied styles only to hero sections and key emphasis areas. Use consistent presets for everything else.

## Available Presets

**Filled:** `preset-filled-{color}-{lightShade}-{darkShade}`

- `preset-filled-primary-500` - main CTA
- `preset-filled-primary-700-300` - high priority
- `preset-filled-secondary-600-400` - secondary actions

**Tonal:** `preset-tonal-{color}`

- `preset-tonal-primary` - emphasis cards/alerts
- `preset-tonal-success/warning/error` - status messages
- `preset-tonal-surface` - neutral content

**Outlined:** `preset-outlined-{color}-{shade}-{shade}`

- `preset-outlined-primary-500` - secondary buttons
- `preset-outlined-surface-200-800` - inputs

## Usage Strategy

**Hero/Key Areas (varied styles):**

- Main CTA: `preset-filled-primary-500`
- Secondary CTA: `preset-outlined-primary-500`
- Background: `preset-tonal-primary`
- Special effects: `preset-glass-primary`, `preset-gradient`

**General Content (consistent):**

- Default buttons: `btn preset-tonal`
- Links: `preset-outlined-primary-500`
- Cards: `preset-tonal-surface`
- Inputs: `preset-outlined-surface-200-800`

**Interactions:**

- Hover: `hover:preset-tonal-primary`
- Ghost: `btn hover:preset-tonal`
- Elevated: `preset-filled-surface-100-900 shadow-xl`

**Status:**

- Success: `preset-tonal-success`
- Warning: `preset-tonal-warning`
- Error: `preset-tonal-error`

## Rules

- Hero sections: creative preset combinations allowed
- General areas: stick to neutral/surface presets
- No custom colors outside these presets
- Maintain consistency across similar elements

# Supabase Development

Supabase 관련 개발 지침은 `supabase/CLAUDE.md`를 참조하세요.

- Edge Functions 개발 가이드
- 테스트 및 배포 방법
- 환경 변수 설정
- Realtime/Broadcast 사용법
- 디버깅 및 문제 해결

## Supabase CLI 사용법

시스템에 Supabase CLI가 직접 설치되어 있으므로 `pnpm` 없이 직접 명령어를 사용합니다:

```bash
# 타입 생성 (pnpm 없이)
supabase gen types typescript --linked

# 마이그레이션 실행
supabase migration up

# Edge Functions 배포
supabase functions deploy
```
