-- Create storage bucket for TTS audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('tts-audio', 'tts-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to TTS audio files
CREATE POLICY "Public can read TTS audio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'tts-audio');

-- Allow service role to upload TTS audio files
CREATE POLICY "Service role can upload TTS audio files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tts-audio');

-- Allow service role to update TTS audio files
CREATE POLICY "Service role can update TTS audio files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'tts-audio');
