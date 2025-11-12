-- Enable Realtime for content analysis tables

-- Add tables to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_tags;
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_metrics;

-- Set replica identity to full for better change tracking
ALTER TABLE public.video_categories REPLICA IDENTITY FULL;
ALTER TABLE public.video_tags REPLICA IDENTITY FULL;
ALTER TABLE public.content_metrics REPLICA IDENTITY FULL;
