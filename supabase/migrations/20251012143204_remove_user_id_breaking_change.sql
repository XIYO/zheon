-- BREAKING CHANGE: Remove user_id column and simplify to public cache model
-- All users can read, only service_role can write

-- 1. Drop all existing RLS policies
DROP POLICY IF EXISTS "Owner can see own pending/processing" ON public.summary;
DROP POLICY IF EXISTS "Anyone can see completed" ON public.summary;
DROP POLICY IF EXISTS "Authenticated can insert own records" ON public.summary;
DROP POLICY IF EXISTS "Owner can update own records" ON public.summary;
DROP POLICY IF EXISTS "Owner can delete own records" ON public.summary;
DROP POLICY IF EXISTS "Owner can see own failed" ON public.summary;
DROP POLICY IF EXISTS "Service role full access" ON public.summary;
DROP POLICY IF EXISTS "Allow anonymous read" ON public.summary;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.summary;
DROP POLICY IF EXISTS "Allow service role full access" ON public.summary;

-- 2. Drop user_id related indexes
DROP INDEX IF EXISTS idx_summary_user_id;

-- 3. Drop user_id column
ALTER TABLE public.summary DROP COLUMN IF EXISTS user_id;

-- 4. Create new simplified RLS policies

-- All users can read
CREATE POLICY "Public read access" ON public.summary
    FOR SELECT TO authenticated, anon
    USING (true);

-- All users (including anonymous) can insert
CREATE POLICY "Public insert access" ON public.summary
    FOR INSERT TO authenticated, anon
    WITH CHECK (true);

-- Only service_role can update/delete
CREATE POLICY "Service role update access" ON public.summary
    FOR UPDATE TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role delete access" ON public.summary
    FOR DELETE TO service_role
    USING (true);

-- 5. Drop check_existing_summary function (no longer needed with UPSERT)
DROP FUNCTION IF EXISTS public.check_existing_summary(TEXT, UUID);
DROP FUNCTION IF EXISTS public.check_existing_summary(TEXT);

-- Grant permissions
GRANT SELECT, INSERT ON public.summary TO anon, authenticated;
GRANT ALL ON public.summary TO service_role;
