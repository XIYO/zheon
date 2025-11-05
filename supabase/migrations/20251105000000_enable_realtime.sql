-- Enable Realtime for summaries table
ALTER PUBLICATION supabase_realtime ADD TABLE zheon.summaries;

-- Set replica identity to full for better change tracking
ALTER TABLE zheon.summaries REPLICA IDENTITY FULL;
