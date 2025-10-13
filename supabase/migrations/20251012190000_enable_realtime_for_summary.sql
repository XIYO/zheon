-- Enable Realtime for summary table
-- This allows clients to receive real-time updates when summary records are updated

-- Set REPLICA IDENTITY to FULL to track all column changes
ALTER TABLE public.summary REPLICA IDENTITY FULL;

-- Add summary table to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.summary;
