-- profiles 테이블: YouTube 구독 동기화 상태 추가
ALTER TABLE public.profiles
ADD COLUMN youtube_subscription_sync_status TEXT CHECK (youtube_subscription_sync_status IN ('idle', 'processing', 'completed', 'failed')),
ADD COLUMN youtube_subscription_synced_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.youtube_subscription_sync_status IS 'YouTube 구독 목록 동기화 상태: idle/processing/completed/failed';
COMMENT ON COLUMN public.profiles.youtube_subscription_synced_at IS 'YouTube 구독 목록 마지막 동기화 시간';

-- channels 테이블: 비디오 동기화 상태 추가
ALTER TABLE public.channels
ADD COLUMN video_sync_status TEXT CHECK (video_sync_status IN ('idle', 'processing', 'completed', 'failed')),
ADD COLUMN video_synced_at TIMESTAMPTZ;

COMMENT ON COLUMN public.channels.video_sync_status IS '채널 비디오 목록 동기화 상태: idle/processing/completed/failed';
COMMENT ON COLUMN public.channels.video_synced_at IS '채널 비디오 목록 마지막 동기화 시간';
