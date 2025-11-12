# Docker 로컬 테스트 가이드

## 빠른 시작

### 1. 환경 변수 설정

`docker-compose.yml` 파일을 열고 실제 값을 입력하세요 (환경 변수 키는 코드와 동일하게 유지):

```yaml
environment:
  ORIGIN: http://localhost:3000
  PORT: 3000
  TOR_SOCKS5_PROXY: socks5://zheon-tor-proxy:9050

  # Supabase (로컬/원격 중 택일)
  PUBLIC_SUPABASE_URL: http://host.docker.internal:55321
  PUBLIC_SUPABASE_PUBLISHABLE_KEY: your-publishable-key
  SUPABASE_SECRET_KEY: your-service-role-key

  # AI
  GEMINI_API_KEY: your-gemini-api-key

  # OAuth (선택)
  GOOGLE_CLIENT_ID: ...
  GOOGLE_CLIENT_SECRET: ...
  # YouTube API (선택, 필요 시)
  YOUTUBE_API_KEY: ...
```

### 2. 빌드 & 실행

```bash
docker compose up --build
```

이 명령으로:

- ✅ Dockerfile 자동 빌드
- ✅ tor-proxy 컨테이너 시작
- ✅ zheon 앱 컨테이너 시작 (tor-proxy healthy 대기)

### 3. 접속

```bash
open http://localhost:3000
```

### 4. 로그 확인

```bash
# 전체 로그
docker compose logs -f

# zheon 앱만
docker compose logs -f zheon

# tor-proxy만
docker compose logs -f tor-proxy
```

### 5. 중지 & 정리

```bash
# 중지
docker compose down

# 중지 + 이미지 삭제
docker compose down --rmi all

# 중지 + 볼륨 삭제
docker compose down -v
```

## 구조

```
docker-compose.yml
├── tor-proxy (xiyo/tor-proxy:latest)
│   ├── 포트: 9050 (SOCKS5), 8118 (HTTP)
│   └── 네트워크: zheon-network
│
└── zheon (자동 빌드)
    ├── 빌드: Dockerfile
    ├── 포트: 3000
    ├── 의존성: tor-proxy (healthy)
    └── 네트워크: zheon-network
```

## 주의사항

1. **Supabase 설정 필수**
   - 원격 Supabase 서버 사용
   - 마이그레이션은 별도 실행 필요:
     ```bash
     cd supabase
     supabase db push --project-ref your-project-ref
     ```

2. **TTS API 키**
   - ELEVENLABS_API_KEY 또는 LMNT_API_KEY 중 하나는 필수
   - 둘 다 설정 가능

3. **네트워크**
   - tor-proxy와 zheon은 zheon-network로 통신
   - zheon에서 tor-proxy 접근: `socks5://zheon-tor-proxy:9050`

4. **빌드 캐시**
   - 첫 빌드는 시간이 걸립니다 (의존성 설치)
   - 이후는 Docker 캐시로 빠름
   - 강제 리빌드: `docker compose build --no-cache`

## 트러블슈팅

### 컨테이너가 계속 재시작됨

```bash
docker compose logs zheon
```

로그 확인 후 환경 변수가 올바른지 체크

### tor-proxy 연결 안 됨

```bash
docker compose ps
```

tor-proxy가 healthy 상태인지 확인

### 포트 충돌

```bash
# 포트 변경 (docker-compose.yml)
ports:
  - '3001:3000'  # 외부:내부
```

## 개발 vs 프로덕션

- **이 설정**: 로컬 테스트용
- **프로덕션**: `ops/` 디렉토리의 설정 사용
  - GitHub Actions로 자동 배포
  - ghcr.io에서 이미지 pull
  - Traefik로 HTTPS 자동 설정
