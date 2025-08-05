/**
 * Supabase Client - Shared Database Connection
 * 
 * Edge Functions에서 사용할 Supabase 클라이언트 설정
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

export interface VideoSummary {
  id?: string;
  youtube_url: string;
  video_title?: string;
  transcript: string;
  summary?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Supabase 클라이언트 생성 (서비스 롤)
 * Edge Functions에서 RLS 우회하여 데이터 저장
 */
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * 사용자 인증이 포함된 Supabase 클라이언트 생성
 * RLS 정책 적용됨
 */
export function createSupabaseClientWithAuth(authHeader: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}