-- channels 테이블: 인증된 사용자가 채널을 upsert할 수 있도록 정책 추가
DROP POLICY IF EXISTS "Authenticated users can upsert channels" ON public.channels;
DROP POLICY IF EXISTS "Authenticated users can update channels" ON public.channels;

CREATE POLICY "Authenticated users can upsert channels"
ON public.channels
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update channels"
ON public.channels
FOR UPDATE
TO authenticated
USING (true);
