# Zheon 디자인 가이드

유튜브 영상 요약 서비스 Zheon의 UI/UX 디자인 가이드라인입니다.

## 🎨 디자인 철학

**모노크로매틱 미니멀리즘**

- 깔끔하고 세련된 흑백 기반 디자인
- 콘텐츠에 집중할 수 있는 방해받지 않는 인터페이스
- 한국적 미감을 담은 '展(펼칠 전)' 브랜딩

## 📐 컬러 팔레트

### 주요 색상

```css
/* 메인 컬러 */
--primary-black: #000000; /* bg-black */
--primary-dark: #111827; /* bg-gray-900 */

/* 배경 색상 */
--bg-primary: #ffffff; /* bg-white */
--bg-secondary: #f9fafb; /* bg-gray-50 */

/* 테두리 & 구분선 */
--border-light: #e5e7eb; /* border-gray-200 */
--border-medium: #d1d5db; /* border-gray-300 */
--border-dark: #4b5563; /* border-gray-600 */

/* 텍스트 색상 */
--text-primary: #111827; /* text-gray-900 */
--text-secondary: #374151; /* text-gray-700 */
--text-tertiary: #6b7280; /* text-gray-500 */
--text-muted: #9ca3af; /* text-gray-400 */
--text-light: #d1d5db; /* text-gray-300 */
```

### 색상 사용 가이드

- **검은색**: CTA 버튼, 헤더 배경, 강조 요소
- **회색 스케일**: 텍스트 계층 구조, 배경, 테두리
- **흰색**: 주요 배경, 카드 배경

### 폰트 크기 체계

```css
/* 제목 */
--text-5xl: 3rem; /* 48px - 메인 히어로 제목 */
--text-4xl: 2.25rem; /* 36px - 섹션 제목 */
--text-3xl: 1.875rem; /* 30px - 페이지 제목 */
--text-2xl: 1.5rem; /* 24px - 서브 제목 */
--text-xl: 1.25rem; /* 20px - 카드 제목 */
--text-lg: 1.125rem; /* 18px - 강조 텍스트 */

/* 본문 */
--text-base: 1rem; /* 16px - 기본 텍스트 */
--text-sm: 0.875rem; /* 14px - 보조 텍스트 */
```

### 폰트 웨이트

```css
--font-light: 300;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### 사용 예시

- **메인 제목**: `text-5xl font-extrabold tracking-tight`
- **섹션 제목**: `text-4xl font-bold`
- **카드 제목**: `text-xl font-semibold`
- **본문**: `text-base leading-relaxed`
- **보조 텍스트**: `text-sm text-gray-600`

## 🏗️ 레이아웃 시스템

### 그리드 시스템

```css
/* 반응형 그리드 패턴 */
.responsive-grid {
	@apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4;
}

/* 2컬럼 레이아웃 */
.two-column {
	@apply grid md:grid-cols-2 gap-8 items-center;
}
```

### 컨테이너 크기

```css
/* 최대 너비 제한 */
--container-sm: 24rem; /* max-w-sm - 384px */
--container-md: 28rem; /* max-w-md - 448px */
--container-4xl: 56rem; /* max-w-4xl - 896px */
--container-6xl: 72rem; /* max-w-6xl - 1152px */
```

### 스페이싱

```css
/* 일반적인 간격 */
--space-4: 1rem; /* gap-4, p-4 */
--space-6: 1.5rem; /* gap-6, p-6 */
--space-8: 2rem; /* gap-8, p-8 */
--space-12: 3rem; /* gap-12, p-12 */
--space-20: 5rem; /* py-20 */
--space-24: 6rem; /* py-24 */
```

## 🧱 컴포넌트 스타일

### 카드 컴포넌트

```css
.card {
	@apply rounded-lg border border-gray-200 bg-white p-4 shadow-sm;
	@apply transition-all hover:shadow-md hover:border-gray-300;
}

.card-large {
	@apply rounded-lg border border-gray-200 bg-white p-6 shadow-sm;
}
```

### 버튼 스타일

```css
/* 주요 버튼 */
.btn-primary {
	@apply rounded-md bg-gray-900 px-4 py-2.5 font-medium text-white;
	@apply transition-colors hover:bg-black;
	@apply disabled:opacity-50;
}

/* 보조 버튼 */
.btn-secondary {
	@apply rounded-md border border-gray-600 bg-gray-900 px-6 py-3;
	@apply text-sm font-medium text-white;
	@apply hover:bg-black hover:border-gray-500 transition-colors;
}

/* 링크 버튼 */
.btn-link {
	@apply text-sm text-gray-300 underline-offset-4;
	@apply hover:underline hover:text-white;
}
```

### 폼 요소

```css
/* 입력 필드 */
.input {
	@apply w-full rounded-md border border-gray-300 bg-white;
	@apply px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500;
	@apply focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900;
}

/* 라벨 */
.label {
	@apply block text-sm font-medium text-gray-600 mb-1;
}

/* 에러 메시지 */
.error-message {
	@apply block text-sm text-red-600 min-h-[1.5em];
}
```

## 🎯 페이지별 레이아웃 패턴

### 랜딩 페이지

- **히어로 섹션**: 어두운 배경 (`bg-gray-900`) + 흰색 텍스트
- **설명 섹션**: 밝은 배경 (`bg-gray-50`) + 어두운 텍스트
- **2컬럼 레이아웃**: 텍스트 + 시각적 요소

### 대시보드

- **중앙 정렬**: `flex min-h-screen flex-col items-center justify-start`
- **폼 카드**: 최대 너비 제한 + 그림자 효과
- **그리드 카드**: 반응형 그리드 시스템

### 상세 페이지

- **최대 너비**: `max-w-4xl` 컨테이너
- **섹션 구분**: 명확한 제목과 콘텐츠 영역
- **백 네비게이션**: 일관된 스타일

### 인증 페이지

- **전체 화면**: `min-h-screen` + 중앙 정렬
- **폼 중심**: 명확한 폼 구조
- **최소한의 UI**: 방해 요소 제거

## 🎭 상호작용 및 애니메이션

### 호버 효과

```css
/* 카드 호버 */
.card-hover {
	@apply transition-all hover:shadow-md hover:border-gray-300;
}

/* 이미지 호버 */
.image-hover {
	@apply transition-transform group-hover:scale-[1.02];
}

/* 버튼 호버 */
.button-hover {
	@apply transition-colors hover:bg-black;
}
```

### 로딩 상태

```css
.loading-spinner {
	@apply h-5 w-5 animate-spin text-white;
}
```

### 모달/다이얼로그

```css
.modal {
	@apply m-auto max-w-md rounded-lg backdrop:bg-black/30 bg-gray-50 p-4;
}
```

## 📱 반응형 디자인

### 브레이크포인트

- **sm**: 640px 이상
- **md**: 768px 이상
- **lg**: 1024px 이상
- **xl**: 1280px 이상

### 패턴

```css
/* 모바일 우선 접근법 */
.responsive-text {
	@apply text-base md:text-lg;
}

.responsive-grid {
	@apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4;
}

.responsive-padding {
	@apply px-4 py-8 md:px-6 md:py-12;
}
```

## 🔧 코딩 컨벤션

### 클래스 순서

1. 레이아웃 (display, position)
2. 박스 모델 (width, height, margin, padding)
3. 타이포그래피 (font, text)
4. 시각적 효과 (background, border, shadow)
5. 기타 (transition, transform)

### 네이밍 패턴

- **BEM 방식 적용**: `component__element--modifier`
- **유틸리티 클래스 우선**: TailwindCSS 클래스 활용
- **시맨틱 명명**: 의미있는 클래스명 사용

## ✅ 체크리스트

### 새 컴포넌트 생성 시

- [ ] 일관된 색상 팔레트 사용
- [ ] 반응형 디자인 적용
- [ ] 호버/포커스 상태 정의
- [ ] 로딩/에러 상태 고려
- [ ] 접근성 (a11y) 고려

### 페이지 생성 시

- [ ] 적절한 컨테이너 너비 설정
- [ ] 타이포그래피 계층 구조 확립
- [ ] 네비게이션 패턴 일관성 유지
- [ ] 모바일 환경 테스트

## 🎨 디자인 토큰 활용

프로젝트에서는 TailwindCSS를 기반으로 하되, 위의 가이드라인을 따라 일관된 디자인을 유지합니다. 새로운 컴포넌트나 페이지를 만들 때는 기존 패턴을 참고하여 통일성 있는 사용자 경험을 제공해야 합니다.
