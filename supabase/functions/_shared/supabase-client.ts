/**
 * Supabase Client - Shared Database Connection
 *
 * Edge Functions에서 사용할 Supabase 클라이언트 설정
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Supabase 클라이언트 생성 (Secret Key)
 * Edge Functions에서 RLS 우회하여 데이터 저장
 */
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
