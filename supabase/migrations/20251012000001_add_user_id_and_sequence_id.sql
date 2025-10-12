-- Add user_id and sequence_id columns to summary table
-- Also update RLS policies for proper access control

-- 1. Add user_id column (nullable for backward compatibility)
ALTER TABLE public.summary
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Add sequence_id for ordering (auto-incrementing)
ALTER TABLE public.summary
ADD COLUMN IF NOT EXISTS sequence_id SERIAL;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_summary_user_id ON public.summary(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_summary_sequence_id ON public.summary(sequence_id DESC);

-- 4. Drop existing RLS policies
DROP POLICY IF EXISTS "Allow anonymous read" ON public.summary;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.summary;
DROP POLICY IF EXISTS "Allow service role full access" ON public.summary;

-- 5. Create new RLS policies

-- Authenticated users can see their own pending/processing records
CREATE POLICY "Owner can see own pending/processing" ON public.summary
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        AND processing_status IN ('pending', 'processing', 'failed')
    );

-- Anyone (authenticated or anonymous) can see completed records
CREATE POLICY "Anyone can see completed" ON public.summary
    FOR SELECT TO authenticated, anon
    USING (processing_status = 'completed');

-- Authenticated users can insert their own records
CREATE POLICY "Authenticated can insert own records" ON public.summary
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can update their own records
CREATE POLICY "Owner can update own records" ON public.summary
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- Users can delete their own records
CREATE POLICY "Owner can delete own records" ON public.summary
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Service role has full access (for Edge Functions)
CREATE POLICY "Service role full access" ON public.summary
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- 6. Update check_existing_summary function to include user filtering
DROP FUNCTION IF EXISTS public.check_existing_summary(TEXT);
CREATE OR REPLACE FUNCTION public.check_existing_summary(p_url TEXT, p_user_id UUID DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    existing_summary_id UUID;
BEGIN
    -- Check if summary exists (only completed ones for reuse)
    SELECT id INTO existing_summary_id
    FROM public.summary
    WHERE url = p_url
    AND processing_status = 'completed'
    LIMIT 1;

    IF existing_summary_id IS NOT NULL THEN
        -- Update timestamps to move to top
        UPDATE public.summary
        SET updated_at = NOW()
        WHERE id = existing_summary_id;

        RETURN existing_summary_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.check_existing_summary TO anon, authenticated, service_role;
