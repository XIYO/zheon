# YouTube Integration Setup

## 환경변수 설정

### 필수 환경변수

```bash
# YouTube Data API v3 키
YOUTUBE_API_KEY=your_api_key_here

# 자막 추출 API (선택 - 기본값: https://extractor.xiyo.dev/extract)
EXTRACT_API_URL=https://extractor.xiyo.dev/extract

# Supabase 환경변수 (자동 설정됨)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### YouTube API 키 발급 방법

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. **APIs & Services > Library** 이동
4. "YouTube Data API v3" 검색 후 활성화
5. **APIs & Services > Credentials** 이동
6. **Create Credentials > API Key** 클릭
7. 생성된 API 키를 `YOUTUBE_API_KEY` 환경변수로 설정

### Supabase Edge Functions에 환경변수 설정

```bash
# Local 테스트용 (.env 파일)
echo "YOUTUBE_API_KEY=your_api_key_here" >> supabase/.env
echo "EXTRACT_API_URL=https://extractor.xiyo.dev/extract" >> supabase/.env

# Production 배포용
supabase secrets set YOUTUBE_API_KEY=your_api_key_here
supabase secrets set EXTRACT_API_URL=https://extractor.xiyo.dev/extract
```

## API 사용량 제한

YouTube Data API v3는 **하루 10,000 할당량** 제한이 있습니다.

- Channel 정보 조회: **1 할당량**
- Playlist Items 조회: **1 할당량**
- Search (핸들 변환): **100 할당량**

**최적화 전략:**

- 채널 정보를 데이터베이스에 캐싱 (현재 구현됨)
- 가능하면 채널 ID 직접 사용 (핸들 변환 비용 절약)

## 아키텍처

### 채널 정보 (YouTube Data API v3)

- ✅ 패키지 용량 작음 (fetch만 사용)
- ✅ 초기화 비용 없음
- ✅ Edge Function 배포 가능
- ⚠️ API 키 필요 (하루 10,000 할당량)

### 자막 추출 (extractor.xiyo.dev)

- ✅ 외부 API 사용 (https://extractor.xiyo.dev/extract)
- ✅ Edge Function에서 실행 가능
- ✅ 패키지 의존성 없음
- ✅ 메모리 효율적

## Edge Functions

현재 배포된 Edge Functions:

1. **youtube-channel** - 채널 정보 및 영상 목록 조회
2. **summary** - YouTube 영상 요약 생성 (자막 추출 + AI 요약)
3. **insight-generator** - AI 기반 인사이트 생성
4. **tts-stream** - Gemini TTS 음성 생성
5. **process-video** - 영상 처리 파이프라인
