-- Fix RLS policies for summary table
-- Drop all existing policies
DROP POLICY IF EXISTS "Public read access" ON public.summary;
DROP POLICY IF EXISTS "Public insert access" ON public.summary;
DROP POLICY IF EXISTS "Service role update access" ON public.summary;
DROP POLICY IF EXISTS "Service role delete access" ON public.summary;

-- Recreate policies with explicit commands

-- SELECT: Everyone can read
CREATE POLICY "Allow public read" ON public.summary
    FOR SELECT
    TO authenticated, anon
    USING (true);

-- INSERT: Everyone can insert
CREATE POLICY "Allow public insert" ON public.summary
    FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

-- UPDATE: Service role only
CREATE POLICY "Allow service role update" ON public.summary
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

-- DELETE: Service role only
CREATE POLICY "Allow service role delete" ON public.summary
    FOR DELETE
    TO service_role
    USING (true);

-- Grant permissions
GRANT SELECT, INSERT ON public.summary TO anon, authenticated;
GRANT ALL ON public.summary TO service_role;
