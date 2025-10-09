# Work Logs

## 2025-10-09: Edge Function 프롬프트 개선 및 배포

### 작업 내용
- `supabase/functions/_shared/runnables/generate-summary.ts` 프롬프트 대폭 개선
  - summary: 1-2문장 → 500자 체계적 요약
  - insights: 5000자+ 복잡한 구조 → 2000자 3섹션 구조
  - 핵심 개념 설명 + 사전 지식 & 배경 개념 + 추천 학습 자료
  - temperature: 0.4 → 0.3 (정확성 향상)
  - Hallucination 위험 감소 (영상 내용 기반, 실존 자료만 언급)

### 배포 결과
- 모든 Edge Functions 성공적으로 배포 완료
- summary function: 6.362MB
- Dashboard: https://supabase.com/dashboard/project/iefgdhwmgljjacafqomd/functions
