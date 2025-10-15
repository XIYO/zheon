-- YouTube 관련 데이터 전체 삭제

-- 구독 데이터 삭제
DELETE FROM public.youtube_subscriptions;

-- 채널 비디오 데이터 삭제
DELETE FROM public.channel_videos;

-- 채널 데이터 삭제
DELETE FROM public.channels;
