# youtubei.js (YouTube.js) API 기능 목록

YouTube의 private InnerTube API를 위한 JavaScript 클라이언트

## 설치

```bash
npm install youtubei.js@latest
```

## 초기화

```javascript
import { Innertube } from 'youtubei.js';
const yt = await Innertube.create();
```

---

## 📹 비디오

### `getInfo(target, options?)`
전체 비디오 정보 조회 (player + watch next)
```javascript
const info = await yt.getInfo('video_id');
```

### `getBasicInfo(video_id, options?)`
기본 비디오 정보만 조회 (player only)
```javascript
const info = await yt.getBasicInfo('video_id');
```

### `getShortsVideoInfo(video_id, client?)`
YouTube Shorts 정보 조회
```javascript
const info = await yt.getShortsVideoInfo('video_id');
```

### `getStreamingData(video_id, options?)`
디사이퍼된 스트리밍 데이터 반환
```javascript
const format = await yt.getStreamingData('video_id', { quality: 'best' });
```

### `download(video_id, options?)`
비디오 다운로드 스트림 반환
```javascript
const stream = await yt.download('video_id');
```

---

## 🔍 검색

### `search(query, filters?)`
비디오/채널/재생목록 검색
```javascript
const results = await yt.search('query', {
  upload_date: 'today',
  type: 'video',
  duration: 'short',
  sort_by: 'relevance',
  features: ['hd', '4k', 'subtitles']
});
```

**필터 옵션:**
- `upload_date`: 'hour', 'today', 'week', 'month', 'year'
- `type`: 'video', 'channel', 'playlist', 'movie'
- `duration`: 'short', 'medium', 'long'
- `sort_by`: 'relevance', 'rating', 'upload_date', 'view_count'
- `features`: '4k', 'hd', 'subtitles', 'creative_commons', 'live', '360', '3d', 'hdr', 'vr180', 'location', 'purchased'

### `getSearchSuggestions(query, previous_query?)`
검색 자동완성 제안
```javascript
const suggestions = await yt.getSearchSuggestions('query');
```

---

## 💬 댓글

### `getComments(video_id, sort_by?, comment_id?)`
비디오 댓글 조회
```javascript
const comments = await yt.getComments('video_id', 'TOP_COMMENTS');
// sort_by: 'TOP_COMMENTS' | 'NEWEST_FIRST'

// 더 가져오기
if (comments.has_continuation) {
  const more = await comments.getContinuation();
}
```

### `getPostComments(post_id, channel_id, sort_by?)`
커뮤니티 게시물 댓글 조회
```javascript
const comments = await yt.getPostComments('post_id', 'channel_id');
```

---

## 📺 채널

### `getChannel(id)`
채널 정보 조회
```javascript
const channel = await yt.getChannel('UC...');

// 채널 비디오
const videos = await channel.getVideos();
const popular = await videos.applyFilter('Popular');

// 채널 정보
const about = await channel.getAbout();

// 채널 재생목록
const playlists = await channel.getPlaylists();

// 추천 채널
const channels = await channel.getChannels();

// 커뮤니티 게시물
const posts = await channel.getCommunity();

// 쇼츠
const shorts = await channel.getShorts();

// 라이브
const streams = await channel.getLiveStreams();
```

---

## 🏠 피드

### `getHomeFeed()`
홈 피드
```javascript
const home = await yt.getHomeFeed();
```

### `getSubscriptionsFeed()`
**구독 피드 (OAuth 필요)**
```javascript
const feed = await yt.getSubscriptionsFeed();
```

### `getChannelsFeed()`
채널 피드
```javascript
const feed = await yt.getChannelsFeed();
```

### `getTrending()`
인기 급상승
```javascript
const trending = await yt.getTrending();
```

### `getLibrary()`
라이브러리
```javascript
const library = await yt.getLibrary();
```

### `getHistory()`
시청 기록 (OAuth 필요)
```javascript
const history = await yt.getHistory();
```

---

## 📝 재생목록

### `getPlaylists()`
내 재생목록 목록 (OAuth 필요)
```javascript
const playlists = await yt.getPlaylists();
```

### `getPlaylist(id)`
재생목록 조회
```javascript
const playlist = await yt.getPlaylist('PLxxx...');
```

### `playlist.create(title, video_ids?)`
재생목록 생성 (OAuth 필요)
```javascript
await yt.playlist.create('My Playlist', ['video_id1', 'video_id2']);
```

---

## 💫 상호작용 (OAuth 필요)

### `interact.like(video_id)`
좋아요
```javascript
await yt.interact.like('video_id');
```

### `interact.dislike(video_id)`
싫어요
```javascript
await yt.interact.dislike('video_id');
```

### `interact.removeRating(video_id)`
평가 제거
```javascript
await yt.interact.removeRating('video_id');
```

### `interact.subscribe(channel_id)`
채널 구독
```javascript
await yt.interact.subscribe('UCxxx...');
```

### `interact.unsubscribe(channel_id)`
구독 취소
```javascript
await yt.interact.unsubscribe('UCxxx...');
```

### `interact.comment(video_id, text)`
댓글 작성
```javascript
await yt.interact.comment('video_id', 'Great video!');
```

### `interact.translate(text, target_language, args?)`
댓글 번역
```javascript
const result = await yt.interact.translate('Hello', 'ko', { video_id: 'xxx' });
console.log(result.translated_content);
```

### `interact.setNotificationPreferences(channel_id, type)`
알림 설정
```javascript
await yt.interact.setNotificationPreferences('UCxxx...', 'ALL');
// type: 'PERSONALIZED' | 'ALL' | 'NONE'
```

---

## 👤 계정 (OAuth 필요)

### `account.getInfo(all?)`
계정 정보 조회
```javascript
// 활성 채널 정보
const info = await yt.account.getInfo();

// 모든 채널 정보 (쿠키 로그인 시)
const channels = await yt.account.getInfo(true);
```

### `account.getSettings()`
YouTube 설정 조회
```javascript
const settings = await yt.account.getSettings();
```

---

## 🔔 알림

### `getNotifications()`
알림 목록 (OAuth 필요)
```javascript
const notifications = await yt.getNotifications();
```

### `getUnseenNotificationsCount()`
읽지 않은 알림 수 (OAuth 필요)
```javascript
const count = await yt.getUnseenNotificationsCount();
```

---

## 🎯 기타

### `getHashtag(hashtag)`
해시태그 피드
```javascript
const feed = await yt.getHashtag('gaming');
```

### `getPost(post_id, channel_id)`
커뮤니티 게시물 상세
```javascript
const post = await yt.getPost('post_id', 'UCxxx...');
```

### `getGuide()`
가이드 메뉴
```javascript
const guide = await yt.getGuide();
```

### `getCourses()`
코스 목록
```javascript
const courses = await yt.getCourses();
```

### `resolveURL(url)`
URL 해석
```javascript
const endpoint = await yt.resolveURL('https://youtube.com/...');
```

---

## 🔐 인증

### OAuth 로그인
```javascript
import { Innertube, UniversalCache } from 'youtubei.js';

const yt = await Innertube.create({
  cache: new UniversalCache(false)
});

yt.session.on('auth-pending', (data) => {
  console.log(`${data.verification_url}에서 ${data.user_code} 입력`);
});

yt.session.on('auth', ({ credentials }) => {
  console.log('로그인 성공:', credentials);
});

await yt.session.signIn();

// 세션 캐시
await yt.session.oauth.cacheCredentials();

// 로그아웃
await yt.session.signOut();
```

---

## ⚠️ 중요 사항

1. **OAuth 필요 기능**: 구독, 좋아요, 댓글 작성 등은 `signIn()` 필요
2. **비공식 API**: InnerTube는 YouTube의 private API로 언제든 변경/중단 가능
3. **할당량 제한 없음**: 공식 Data API와 달리 할당량 제한 없음
4. **구독 정보**: `getSubscriptionsFeed()`는 **본인의 구독 목록만** 조회 가능
