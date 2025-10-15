export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      channel_videos: {
        Row: {
          channel_id: string
          created_at: string | null
          duration: string | null
          published_at: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_data: Json | null
          video_id: string
          view_count: string | null
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          duration?: string | null
          published_at?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_data?: Json | null
          video_id: string
          view_count?: string | null
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          duration?: string | null
          published_at?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_data?: Json | null
          video_id?: string
          view_count?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_videos_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["channel_id"]
          },
        ]
      }
      channels: {
        Row: {
          channel_avatar: string | null
          channel_data: Json | null
          channel_handle: string | null
          channel_id: string
          channel_name: string
          created_at: string | null
          description: string | null
          subscriber_count: string | null
          updated_at: string | null
          video_count: number | null
          video_sync_status: string | null
          video_synced_at: string | null
        }
        Insert: {
          channel_avatar?: string | null
          channel_data?: Json | null
          channel_handle?: string | null
          channel_id: string
          channel_name: string
          created_at?: string | null
          description?: string | null
          subscriber_count?: string | null
          updated_at?: string | null
          video_count?: number | null
          video_sync_status?: string | null
          video_synced_at?: string | null
        }
        Update: {
          channel_avatar?: string | null
          channel_data?: Json | null
          channel_handle?: string | null
          channel_id?: string
          channel_name?: string
          created_at?: string | null
          description?: string | null
          subscriber_count?: string | null
          updated_at?: string | null
          video_count?: number | null
          video_sync_status?: string | null
          video_synced_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string
          updated_at: string | null
          youtube_subscription_sync_status: string | null
          youtube_subscription_synced_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          updated_at?: string | null
          youtube_subscription_sync_status?: string | null
          youtube_subscription_synced_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
          youtube_subscription_sync_status?: string | null
          youtube_subscription_synced_at?: string | null
        }
        Relationships: []
      }
      summary: {
        Row: {
          channel_id: string | null
          channel_name: string | null
          created_at: string | null
          duration: number | null
          id: string
          insights: string | null
          insights_audio_status: string | null
          insights_audio_url: string | null
          language: string | null
          processing_status: string | null
          sequence_id: number
          summary: string | null
          summary_audio_status: string | null
          summary_audio_url: string | null
          thumbnail_url: string | null
          title: string | null
          transcript: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          channel_id?: string | null
          channel_name?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          insights?: string | null
          insights_audio_status?: string | null
          insights_audio_url?: string | null
          language?: string | null
          processing_status?: string | null
          sequence_id?: number
          summary?: string | null
          summary_audio_status?: string | null
          summary_audio_url?: string | null
          thumbnail_url?: string | null
          title?: string | null
          transcript?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          channel_id?: string | null
          channel_name?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          insights?: string | null
          insights_audio_status?: string | null
          insights_audio_url?: string | null
          language?: string | null
          processing_status?: string | null
          sequence_id?: number
          summary?: string | null
          summary_audio_status?: string | null
          summary_audio_url?: string | null
          thumbnail_url?: string | null
          title?: string | null
          transcript?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          api_units_used: number | null
          channels_synced: number | null
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          success: boolean | null
          sync_type: string
          user_id: string
        }
        Insert: {
          api_units_used?: number | null
          channels_synced?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          success?: boolean | null
          sync_type: string
          user_id: string
        }
        Update: {
          api_units_used?: number | null
          channels_synced?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          success?: boolean | null
          sync_type?: string
          user_id?: string
        }
        Relationships: []
      }
      youtube_subscriptions: {
        Row: {
          channel_id: string
          created_at: string | null
          id: string
          subscribed_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          id?: string
          subscribed_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          id?: string
          subscribed_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "youtube_subscriptions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["channel_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      check_existing_video: {
        Args: { p_youtube_url: string }
        Returns: string
      }
      cleanup_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_subscription_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_stuck_summary_records: {
        Args: { timeout_minutes?: number }
        Returns: {
          id: number
          new_status: string
          old_status: string
          url: string
        }[]
      }
      delete_expired_youtube_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      match_knowledge_vectors: {
        Args: {
          filter_domain?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          domain: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      update_processing_status: {
        Args: { p_section: string; p_summary_id: string }
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
