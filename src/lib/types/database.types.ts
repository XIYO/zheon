export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      channels: {
        Row: {
          channel_data: Json | null
          channel_id: string
          created_at: string
          custom_url: string | null
          description: string | null
          published_at: string | null
          subscriber_count: string | null
          thumbnail_height: number | null
          thumbnail_url: string | null
          thumbnail_width: number | null
          title: string
          updated: string | null
          updated_at: string | null
          uploads_playlist_id: string | null
          video_count: number | null
          video_sync_status: string | null
          video_synced_at: string | null
          view_count: number | null
        }
        Insert: {
          channel_data?: Json | null
          channel_id: string
          created_at?: string
          custom_url?: string | null
          description?: string | null
          published_at?: string | null
          subscriber_count?: string | null
          thumbnail_height?: number | null
          thumbnail_url?: string | null
          thumbnail_width?: number | null
          title: string
          updated?: string | null
          updated_at?: string | null
          uploads_playlist_id?: string | null
          video_count?: number | null
          video_sync_status?: string | null
          video_synced_at?: string | null
          view_count?: number | null
        }
        Update: {
          channel_data?: Json | null
          channel_id?: string
          created_at?: string
          custom_url?: string | null
          description?: string | null
          published_at?: string | null
          subscriber_count?: string | null
          thumbnail_height?: number | null
          thumbnail_url?: string | null
          thumbnail_width?: number | null
          title?: string
          updated?: string | null
          updated_at?: string | null
          uploads_playlist_id?: string | null
          video_count?: number | null
          video_sync_status?: string | null
          video_synced_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          comment_id: string
          created_at: string
          data: Json
          id: string
          sentiment: string | null
          sentiment_analyzed_at: string | null
          sentiment_confidence: number | null
          updated_at: string | null
          video_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          data: Json
          id?: string
          sentiment?: string | null
          sentiment_analyzed_at?: string | null
          sentiment_confidence?: number | null
          updated_at?: string | null
          video_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          data?: Json
          id?: string
          sentiment?: string | null
          sentiment_analyzed_at?: string | null
          sentiment_confidence?: number | null
          updated_at?: string | null
          video_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string | null
          youtube_subscription_sync_status: string | null
          youtube_subscription_synced_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string | null
          youtube_subscription_sync_status?: string | null
          youtube_subscription_synced_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string | null
          youtube_subscription_sync_status?: string | null
          youtube_subscription_synced_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          channel_id: string
          created_at: string
          description: string | null
          id: string
          published_at: string | null
          resource_kind: string | null
          subscribed_at: string | null
          subscription_data: Json | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          description?: string | null
          id?: string
          published_at?: string | null
          resource_kind?: string | null
          subscribed_at?: string | null
          subscription_data?: Json | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          description?: string | null
          id?: string
          published_at?: string | null
          resource_kind?: string | null
          subscribed_at?: string | null
          subscription_data?: Json | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      summaries: {
        Row: {
          age_group_20s: number | null
          age_group_30s: number | null
          age_group_40plus: number | null
          age_group_teens: number | null
          ai_audience_reaction: string | null
          ai_content_summary: string | null
          ai_key_insights: Json | null
          ai_recommendations: Json | null
          analysis_model: string | null
          analysis_status: string | null
          analyzed_at: string | null
          channel_id: string | null
          channel_name: string | null
          community_constructive: number | null
          community_kindness: number | null
          community_off_topic: number | null
          community_politeness: number | null
          community_quality_score: number | null
          community_rudeness: number | null
          community_self_centered: number | null
          community_toxicity: number | null
          content_category: string | null
          content_clarity: number | null
          content_depth: number | null
          content_educational_value: number | null
          content_entertainment_value: number | null
          content_information_accuracy: number | null
          content_quality_score: number | null
          content_target_audience: string | null
          created_at: string
          duration: number | null
          id: string
          insights: string | null
          insights_audio_status: string | null
          insights_audio_url: string | null
          language: string | null
          processing_status: string | null
          sentiment_intensity: number | null
          sentiment_negative_ratio: number | null
          sentiment_neutral_ratio: number | null
          sentiment_overall_score: number | null
          sentiment_positive_ratio: number | null
          summary: string | null
          summary_audio_status: string | null
          summary_audio_url: string | null
          thumbnail_url: string | null
          title: string | null
          total_comments_analyzed: number | null
          transcript: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          age_group_20s?: number | null
          age_group_30s?: number | null
          age_group_40plus?: number | null
          age_group_teens?: number | null
          ai_audience_reaction?: string | null
          ai_content_summary?: string | null
          ai_key_insights?: Json | null
          ai_recommendations?: Json | null
          analysis_model?: string | null
          analysis_status?: string | null
          analyzed_at?: string | null
          channel_id?: string | null
          channel_name?: string | null
          community_constructive?: number | null
          community_kindness?: number | null
          community_off_topic?: number | null
          community_politeness?: number | null
          community_quality_score?: number | null
          community_rudeness?: number | null
          community_self_centered?: number | null
          community_toxicity?: number | null
          content_category?: string | null
          content_clarity?: number | null
          content_depth?: number | null
          content_educational_value?: number | null
          content_entertainment_value?: number | null
          content_information_accuracy?: number | null
          content_quality_score?: number | null
          content_target_audience?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          insights?: string | null
          insights_audio_status?: string | null
          insights_audio_url?: string | null
          language?: string | null
          processing_status?: string | null
          sentiment_intensity?: number | null
          sentiment_negative_ratio?: number | null
          sentiment_neutral_ratio?: number | null
          sentiment_overall_score?: number | null
          sentiment_positive_ratio?: number | null
          summary?: string | null
          summary_audio_status?: string | null
          summary_audio_url?: string | null
          thumbnail_url?: string | null
          title?: string | null
          total_comments_analyzed?: number | null
          transcript?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          age_group_20s?: number | null
          age_group_30s?: number | null
          age_group_40plus?: number | null
          age_group_teens?: number | null
          ai_audience_reaction?: string | null
          ai_content_summary?: string | null
          ai_key_insights?: Json | null
          ai_recommendations?: Json | null
          analysis_model?: string | null
          analysis_status?: string | null
          analyzed_at?: string | null
          channel_id?: string | null
          channel_name?: string | null
          community_constructive?: number | null
          community_kindness?: number | null
          community_off_topic?: number | null
          community_politeness?: number | null
          community_quality_score?: number | null
          community_rudeness?: number | null
          community_self_centered?: number | null
          community_toxicity?: number | null
          content_category?: string | null
          content_clarity?: number | null
          content_depth?: number | null
          content_educational_value?: number | null
          content_entertainment_value?: number | null
          content_information_accuracy?: number | null
          content_quality_score?: number | null
          content_target_audience?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          insights?: string | null
          insights_audio_status?: string | null
          insights_audio_url?: string | null
          language?: string | null
          processing_status?: string | null
          sentiment_intensity?: number | null
          sentiment_negative_ratio?: number | null
          sentiment_neutral_ratio?: number | null
          sentiment_overall_score?: number | null
          sentiment_positive_ratio?: number | null
          summary?: string | null
          summary_audio_status?: string | null
          summary_audio_url?: string | null
          thumbnail_url?: string | null
          title?: string | null
          total_comments_analyzed?: number | null
          transcript?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      transcripts: {
        Row: {
          created_at: string
          data: Json
          id: string
          updated_at: string | null
          video_id: string
        }
        Insert: {
          created_at?: string
          data: Json
          id?: string
          updated_at?: string | null
          video_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          updated_at?: string | null
          video_id?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          available_countries: string[] | null
          basic_info_synced_at: string | null
          category: string | null
          channel_id: string
          channel_title: string | null
          created_at: string
          description: string | null
          duration: string | null
          is_family_safe: boolean | null
          is_unlisted: boolean | null
          last_analyzed_at: string | null
          length_seconds: number | null
          playlist_id: string | null
          position: number | null
          publish_date: string | null
          published_at: string | null
          sort_order: number | null
          thumbnail_height: number | null
          thumbnail_url: string | null
          thumbnail_width: number | null
          title: string
          updated: string | null
          updated_at: string | null
          upload_date: string | null
          video_data: Json | null
          video_id: string
          video_insight: Json | null
          view_count: string | null
        }
        Insert: {
          available_countries?: string[] | null
          basic_info_synced_at?: string | null
          category?: string | null
          channel_id: string
          channel_title?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          is_family_safe?: boolean | null
          is_unlisted?: boolean | null
          last_analyzed_at?: string | null
          length_seconds?: number | null
          playlist_id?: string | null
          position?: number | null
          publish_date?: string | null
          published_at?: string | null
          sort_order?: number | null
          thumbnail_height?: number | null
          thumbnail_url?: string | null
          thumbnail_width?: number | null
          title: string
          updated?: string | null
          updated_at?: string | null
          upload_date?: string | null
          video_data?: Json | null
          video_id: string
          video_insight?: Json | null
          view_count?: string | null
        }
        Update: {
          available_countries?: string[] | null
          basic_info_synced_at?: string | null
          category?: string | null
          channel_id?: string
          channel_title?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          is_family_safe?: boolean | null
          is_unlisted?: boolean | null
          last_analyzed_at?: string | null
          length_seconds?: number | null
          playlist_id?: string | null
          position?: number | null
          publish_date?: string | null
          published_at?: string | null
          sort_order?: number | null
          thumbnail_height?: number | null
          thumbnail_url?: string | null
          thumbnail_width?: number | null
          title?: string
          updated?: string | null
          updated_at?: string | null
          upload_date?: string | null
          video_data?: Json | null
          video_id?: string
          video_insight?: Json | null
          view_count?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_stuck_processing: { Args: never; Returns: number }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

