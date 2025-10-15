-- Enable Realtime for channels table
-- This allows clients to receive real-time updates when channel records are updated

ALTER TABLE public.channels REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
