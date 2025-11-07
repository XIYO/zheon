# Zheon Docker 설정

로컬 개발 환경에서 Tor 프록시를 Docker로 실행하기 위한 설정입니다.

## 사용 방법

### 1. Docker Compose로 Tor 프록시 시작

```bash
# 프록시 시작
docker compose up -d

# 로그 확인
docker compose logs -f tor-proxy

# 상태 확인
docker compose ps

# 프록시 중지
docker compose down
```

### 2. 헬스 체크

```bash
# HTTP over Header 프록시 상태 확인
curl http://localhost:8118/health

# 버전 정보 확인
curl http://localhost:8118/version
```

### 3. Tor 프록시 테스트

```bash
# SOCKS5 프록시 테스트 (다른 username = 다른 IP)
curl -x socks5h://user1:pass1@localhost:9050 https://api.ipify.org
curl -x socks5h://user2:pass2@localhost:9050 https://api.ipify.org

# HTTP over Header 프록시 테스트
curl -H "target-url: https://api.ipify.org" \
     -H "username: session-1" \
     http://localhost:8118
```

### 4. Node.js에서 사용

프로젝트의 테스트 스크립트를 실행하면 Tor 연결이 확인됩니다:

```bash
# Tor 프록시가 실행 중일 때
node scripts/test-tor-proxy.js
```

## 환경 변수

`.env` 파일에 다음 설정이 필요합니다:

```bash
# Tor SOCKS5 Proxy
TOR_SOCKS5_PROXY=socks5://127.0.0.1:9050
USE_TOR_PROXY=true
```

## 포트

- `9050`: SOCKS5 프록시 (전통적인 Tor 프록시)
- `8118`: HTTP over Header 프록시 (Cloudflare Workers/Vercel Edge용)

## Circuit Isolation (회로 격리)

Tor 프록시는 username 기반으로 독립적인 Tor 회로를 생성합니다:

- **같은 username** → 같은 Tor 회로 → **같은 출구 IP** (회로 수명 동안)
- **다른 username** → 새로운 Tor 회로 → **다른 출구 IP**
- **username 없음** → 무작위 UUID → **요청마다 랜덤 IP**

### 회로 수명 설정

기본 설정 (Tor 설정 파일):

- `MaxCircuitDirtiness`: 60초 (회로 최대 사용 시간)
- `NewCircuitPeriod`: 30초 (새 회로 생성 주기)

## 커스텀 Tor 설정

커스텀 `torrc` 파일을 마운트하여 설정 변경 가능:

```yaml
services:
  tor-proxy:
    volumes:
      - ./custom-torrc:/etc/tor/torrc:ro
```

### 예시 커스텀 설정

```ini
# 특정 국가 출구 노드만 사용
ExitNodes {us},{ca},{gb}
StrictNodes 1

# 특정 국가 제외
ExcludeExitNodes {cn},{ru}

# 회로 수명 연장 (IP 유지 시간 증가)
MaxCircuitDirtiness 300
NewCircuitPeriod 180
```

## 트러블슈팅

### 프록시가 시작되지 않는 경우

```bash
# 로그 확인
docker compose logs tor-proxy

# 컨테이너 재시작
docker compose restart tor-proxy
```

### Tor 네트워크 연결 확인

```bash
# Tor check 사이트로 확인
curl -x socks5h://test:test@localhost:9050 https://check.torproject.org/api/ip
```

### 포트 충돌

다른 서비스가 9050 또는 8118 포트를 사용 중이면 `docker-compose.yml`에서 포트 변경:

```yaml
ports:
  - '9051:9050' # 호스트 포트 변경
  - '8119:8118'
```

## AI SDK 통합

`src/lib/server/services/summary.service.ts`에서 Tor 프록시가 자동으로 사용됩니다:

```typescript
// .env에서 USE_TOR_PROXY=true 설정 시
// AI 요청이 Tor 프록시를 통해 전송됨
const google = createGoogleGenerativeAI({
	apiKey: geminiApiKey,
	fetch: customFetch // Tor SOCKS5 프록시 사용
});
```

## 주의사항

1. **성능**: Tor를 통한 요청은 일반 요청보다 3-5배 느립니다
2. **프로덕션**: Cloudflare Workers 배포 시에는 Tor 사용 불가 (로컬 개발용)
3. **초기 연결**: Tor 부트스트랩에 5-20초 소요
4. **타임아웃**: AI 요청 타임아웃을 60초 이상으로 설정 권장
