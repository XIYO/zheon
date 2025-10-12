-- Enable RLS on summary table if not already enabled
ALTER TABLE public.summary ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access" ON public.summary;

-- Create policy to allow anyone (including anon) to read summary data
CREATE POLICY "Allow public read access" 
ON public.summary 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Note: Since summary table doesn't have user_id column, 
-- we only allow public read access for now.
-- Write operations can be controlled through Edge Functions with service role key.