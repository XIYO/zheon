# 임베딩의 본질: 의미를 숫자로 표현하기

## 1. 단어 vs 문장 임베딩

### Word Embedding (단어 임베딩)

**한 단어 → 한 벡터**

```
"Game" → [0.23, -0.45, 0.78, ..., 0.12] (768차원)
"Review" → [0.31, -0.52, 0.61, ..., 0.09]
"게임" → [0.21, -0.43, 0.81, ..., 0.15] (Game과 유사)
```

**특징**:

- Word2Vec, GloVe 같은 고전 모델
- 단어 하나의 의미만 포착
- 문맥 무시

**한계**:

```
"Bank" (은행)
"Bank" (강둑)

→ 같은 벡터로 표현됨 (문맥 구분 불가)
```

---

### Sentence Embedding (문장 임베딩)

**전체 문장/문단 → 한 벡터**

```
"This is a great game review"
→ [0.45, -0.23, 0.89, ..., 0.34] (768차원)

"Excellent game evaluation"
→ [0.43, -0.21, 0.91, ..., 0.32] (위와 유사)

"오늘 날씨가 좋아요"
→ [-0.12, 0.78, -0.45, ..., 0.67] (완전히 다름)
```

**특징**:

- Transformer 모델 (BERT, Gemini Embedding)
- 문장 전체의 의미 포착
- 문맥 이해

**Gemini `gemini-embedding-001`은 바로 이것입니다.**

---

## 2. 임베딩의 작동 원리

### 2.1 벡터 공간의 의미

**768차원 공간**에서 각 차원은 추상적인 "의미 특성"을 나타냅니다:

```
차원 1: 긍정/부정 (0.9 = 긍정적)
차원 2: 기술/인문 (-0.5 = 인문학적)
차원 3: 형식/비형식 (0.3 = 약간 형식적)
...
차원 768: ???

실제로는 각 차원의 의미를 인간이 해석할 수 없습니다.
하지만 전체 벡터는 "의미의 좌표"입니다.
```

### 2.2 유사도 측정: Cosine Similarity

**벡터 간 각도로 유사도 측정**:

```
벡터 A: "Game Review" = [0.8, 0.6, 0.0]
벡터 B: "Game Evaluation" = [0.6, 0.8, 0.0]
벡터 C: "Cooking Recipe" = [0.0, 0.0, 1.0]

         A
        /|
       / |
      /  |
     /   | ← 작은 각도 = 높은 유사도
    B    |

    C ←─ 90도 = 유사도 0
```

**수식**:

```
cosine_similarity(A, B) = (A · B) / (||A|| × ||B||)

A와 B가 같은 방향 → 1.0 (완전 일치)
A와 B가 수직 → 0.0 (무관)
A와 B가 반대 → -1.0 (정반대)
```

**PostgreSQL에서**:

```sql
-- <=> 연산자 = 코사인 거리 (1 - similarity)
SELECT 1 - (embedding <=> '[0.23, -0.45, ...]'::vector) as similarity
FROM tags;
```

---

## 3. Transformer 임베딩 작동 과정

### Step 1: 토큰화

```
입력: "Game Review 게임리뷰"

토큰화:
["Game", "Review", "게임", "리뷰"]
↓
토큰 ID:
[1234, 5678, 9012, 3456]
```

### Step 2: 초기 벡터 할당

```
"Game" → [0.1, 0.2, 0.3, ..., 0.5] (768차원)
"Review" → [0.4, 0.1, 0.6, ..., 0.2]
"게임" → [0.2, 0.3, 0.4, ..., 0.6]
"리뷰" → [0.5, 0.2, 0.7, ..., 0.3]
```

### Step 3: Self-Attention (핵심)

**각 토큰이 다른 토큰과의 관계 학습**:

```
"Game"이 "Review"를 보고:
→ "아, 게임 리뷰 맥락이구나"
→ 벡터 조정: [0.1, 0.2, ...] → [0.3, 0.4, ...]

"게임"이 "Game"을 보고:
→ "같은 의미네"
→ 벡터를 Game 쪽으로 이동
```

**12개 레이어 반복** → 점점 정교한 의미 포착

### Step 4: Pooling (통합)

```
4개 토큰 벡터:
[0.3, 0.4, ...] "Game"
[0.5, 0.2, ...] "Review"
[0.4, 0.5, ...] "게임"
[0.6, 0.3, ...] "리뷰"

→ 평균 또는 가중 평균:
[0.45, 0.35, ...] (최종 문장 임베딩)
```

---

## 4. 실제 예시: 의미 공간 시각화

### 768차원 → 2차원으로 축소 (설명용)

```
         게임리뷰 ●
        /          \
    Game Review    Video Game Analysis
       ●                ●
        \          /
         ●───────●
      인디게임   Indie Game


                         요리 레시피 ●
                              ↑
                         (멀리 떨어짐)
```

**관찰**:

- "Game Review"와 "게임리뷰"는 가까움 (같은 의미)
- "인디게임"은 게임 관련 클러스터에 속함
- "요리 레시피"는 완전히 다른 영역

---

## 5. 왜 768차원인가?

### 차원이 많을수록 표현력 ↑

```
1차원: 선 (좋다 ←→ 나쁘다)
2차원: 평면 (좋다/나쁘다 + 밝다/어둡다)
3차원: 공간 (+ 뜨겁다/차갑다)
...
768차원: 엄청나게 복잡한 의미 표현 가능
```

**768은 경험적 최적값**:

- 512: 너무 적음 (의미 손실)
- 1024: 과도함 (계산 비용 ↑, 과적합)
- 768: 적절한 균형

---

## 6. 학습 과정 (간략)

### Pre-training

```
모델에게 수십억 개 문장을 보여줌:
"The quick brown [MASK] jumps over the lazy dog"
→ 모델: "fox일 것 같은데?"

반복 → 단어 간 관계 학습 → 의미 공간 형성
```

### Fine-tuning (임베딩 특화)

```
유사 문장 쌍:
"Game review" ↔ "게임 리뷰" (가깝게)
"Game review" ↔ "요리법" (멀게)

→ 유사도 측정에 최적화
```

---

## 7. 실전 활용: 태그 중복 방지

### 시나리오

```
기존 태그: "Game Review"
LLM이 생성: "Game Evaluation"

name_normalized 비교:
"gamereview" ≠ "gameevaluation" → 새 태그 생성 ❌

임베딩 비교:
embedding("Game Review") vs embedding("Game Evaluation")
→ cosine_similarity = 0.92 (매우 유사) → 재사용 ✅
```

### SQL 구현

```sql
-- 1. 새 태그 임베딩 생성
new_embedding = [0.23, -0.45, 0.78, ...]

-- 2. 유사 태그 검색
SELECT name, 1 - (embedding <=> $1::vector) as similarity
FROM tags
WHERE 1 - (embedding <=> $1::vector) > 0.85
ORDER BY similarity DESC
LIMIT 1;

-- 결과: "Game Review" (similarity: 0.92)
→ 새 태그 생성 대신 기존 것 재사용
```

---

## 8. 실전 활용: 의미 검색

### 기존 방식 (키워드)

```sql
-- "게임 리뷰" 검색
SELECT * FROM summaries
WHERE title ILIKE '%게임%' AND title ILIKE '%리뷰%';

매칭:
✅ "스타듀밸리 게임 리뷰"
❌ "Stardew Valley Game Review" (영문)
❌ "스타듀밸리 플레이 후기" (키워드 다름)
```

### 임베딩 방식 (의미)

```sql
-- "게임 리뷰" 임베딩 생성
query_embedding = embed("게임 리뷰")

-- 유사 영상 검색
SELECT title, 1 - (summary_embedding <=> query_embedding) as score
FROM summaries
ORDER BY score DESC;

매칭:
✅ "스타듀밸리 게임 리뷰" (0.95)
✅ "Stardew Valley Game Review" (0.93) ← 언어 무관!
✅ "스타듀밸리 플레이 후기" (0.89) ← 다른 표현도 OK!
✅ "인디 게임 추천: 스타듀밸리" (0.82)
```

---

## 9. 임베딩의 한계

### 1. 긴 텍스트 제한

```
gemini-embedding-001: 최대 2,048 토큰
→ 긴 영상 자막은 요약 후 임베딩
```

### 2. 숫자/날짜 약함

```
"iPhone 15"와 "iPhone 14"가 매우 유사하게 나옴
→ 정확한 모델명 검색은 키워드 방식이 낫다
```

### 3. 신조어 약함

```
2024년 이후 신조어는 학습 안됨
→ 주기적 모델 업데이트 필요
```

### 4. 블랙박스

```
왜 이 벡터가 이 의미인지 설명 불가
→ 디버깅 어려움
```

---

## 10. 하이브리드 검색 (추천)

**키워드 + 임베딩 결합**:

```typescript
async function searchVideos(query: string) {
	// 1. 키워드 검색 (정확성)
	const keywordResults = await supabase
		.from('summaries')
		.select('*')
		.textSearch('title', query)
		.limit(10);

	// 2. 임베딩 검색 (의미)
	const queryEmbedding = await embed({
		model: google.textEmbedding('gemini-embedding-001'),
		value: query
	});

	const semanticResults = await supabase.rpc('match_summaries', {
		query_embedding: queryEmbedding.embedding,
		match_threshold: 0.7,
		match_count: 10
	});

	// 3. 결과 합치기 (중복 제거 + 점수 재조정)
	const combined = mergeAndRerank(keywordResults, semanticResults);

	return combined;
}
```

---

## 11. 요약

| 질문                | 답변                                             |
| ------------------- | ------------------------------------------------ |
| **단어 vs 문장?**   | 문장 전체를 하나의 벡터로 (Sentence Embedding)   |
| **768차원의 의미?** | 추상적 의미 특성들 (해석 불가, 전체로 의미 표현) |
| **유사도 측정?**    | 코사인 유사도 (벡터 간 각도)                     |
| **작동 원리?**      | Transformer Self-Attention으로 문맥 이해         |
| **왜 필요?**        | 의미 기반 검색, 태그 중복 방지, 다국어 통합      |
| **한계?**           | 긴 텍스트, 숫자, 신조어 약함 → 키워드와 병행     |

---

## 12. 실전 결정: 이 프로젝트에 필요한가?

### 지금 당장 필요 없는 이유

1. 태그 개수 적음 (< 100개)
2. name_normalized로 충분히 중복 방지
3. LLM에게 기존 목록 제공으로 재사용 유도

### 나중에 필요한 시점

1. 태그 500개 이상 (LLM이 전체 목록 기억 못함)
2. 의미 기반 검색 기능 추가
3. 다국어 영상 많아질 때 (한/영 통합 검색)

### 추천

- **지금**: 스키마에 `embedding vector(768)` 컬럼만 추가 (NULL)
- **나중**: 필요할 때 배치로 생성

---

**다음 단계**: 스키마 설계로 돌아갈까요? 아니면 더 궁금한 점이 있나요?
