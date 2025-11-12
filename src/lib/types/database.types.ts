export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	graphql_public: {
		Tables: {
			[_ in never]: never;
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			graphql: {
				Args: {
					extensions?: Json;
					operationName?: string;
					query?: string;
					variables?: Json;
				};
				Returns: Json;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	public: {
		Tables: {
			categories: {
				Row: {
					created_at: string;
					depth: number;
					description: string | null;
					id: string;
					name: string;
					name_ko: string;
					parent_id: string | null;
					path: string[];
					slug: string;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					depth: number;
					description?: string | null;
					id?: string;
					name: string;
					name_ko: string;
					parent_id?: string | null;
					path: string[];
					slug: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					depth?: number;
					description?: string | null;
					id?: string;
					name?: string;
					name_ko?: string;
					parent_id?: string | null;
					path?: string[];
					slug?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'categories_parent_id_fkey';
						columns: ['parent_id'];
						isOneToOne: false;
						referencedRelation: 'categories';
						referencedColumns: ['id'];
					}
				];
			};
			channels: {
				Row: {
					channel_data: Json | null;
					channel_id: string;
					created_at: string;
					custom_url: string | null;
					description: string | null;
					published_at: string | null;
					subscriber_count: string | null;
					thumbnail_height: number | null;
					thumbnail_url: string | null;
					thumbnail_width: number | null;
					title: string;
					updated: string | null;
					updated_at: string | null;
					uploads_playlist_id: string | null;
					video_count: number | null;
					video_sync_status: string | null;
					video_synced_at: string | null;
					view_count: number | null;
				};
				Insert: {
					channel_data?: Json | null;
					channel_id: string;
					created_at?: string;
					custom_url?: string | null;
					description?: string | null;
					published_at?: string | null;
					subscriber_count?: string | null;
					thumbnail_height?: number | null;
					thumbnail_url?: string | null;
					thumbnail_width?: number | null;
					title: string;
					updated?: string | null;
					updated_at?: string | null;
					uploads_playlist_id?: string | null;
					video_count?: number | null;
					video_sync_status?: string | null;
					video_synced_at?: string | null;
					view_count?: number | null;
				};
				Update: {
					channel_data?: Json | null;
					channel_id?: string;
					created_at?: string;
					custom_url?: string | null;
					description?: string | null;
					published_at?: string | null;
					subscriber_count?: string | null;
					thumbnail_height?: number | null;
					thumbnail_url?: string | null;
					thumbnail_width?: number | null;
					title?: string;
					updated?: string | null;
					updated_at?: string | null;
					uploads_playlist_id?: string | null;
					video_count?: number | null;
					video_sync_status?: string | null;
					video_synced_at?: string | null;
					view_count?: number | null;
				};
				Relationships: [];
			};
			comments: {
				Row: {
					comment_id: string;
					created_at: string;
					data: Json;
					id: string;
					sentiment: string | null;
					sentiment_analyzed_at: string | null;
					sentiment_confidence: number | null;
					updated_at: string | null;
					video_id: string;
				};
				Insert: {
					comment_id: string;
					created_at?: string;
					data: Json;
					id?: string;
					sentiment?: string | null;
					sentiment_analyzed_at?: string | null;
					sentiment_confidence?: number | null;
					updated_at?: string | null;
					video_id: string;
				};
				Update: {
					comment_id?: string;
					created_at?: string;
					data?: Json;
					id?: string;
					sentiment?: string | null;
					sentiment_analyzed_at?: string | null;
					sentiment_confidence?: number | null;
					updated_at?: string | null;
					video_id?: string;
				};
				Relationships: [];
			};
			content_community_metrics: {
				Row: {
					age_20s: number | null;
					age_30s: number | null;
					age_40plus: number | null;
					age_adult_ratio: number | null;
					age_median: number | null;
					age_teens: number | null;
					analysis_model: string | null;
					analyzed_at: string | null;
					arousal_mean: number | null;
					comments_analyzed: number | null;
					created_at: string;
					emotion_anger: number | null;
					emotion_anticipation: number | null;
					emotion_disgust: number | null;
					emotion_dominant: string | null;
					emotion_entropy: number | null;
					emotion_fear: number | null;
					emotion_joy: number | null;
					emotion_sadness: number | null;
					emotion_surprise: number | null;
					emotion_trust: number | null;
					framework_version: string | null;
					id: string;
					representative_comments: Json | null;
					updated_at: string | null;
					valence_mean: number | null;
					video_id: string;
				};
				Insert: {
					age_20s?: number | null;
					age_30s?: number | null;
					age_40plus?: number | null;
					age_adult_ratio?: number | null;
					age_median?: number | null;
					age_teens?: number | null;
					analysis_model?: string | null;
					analyzed_at?: string | null;
					arousal_mean?: number | null;
					comments_analyzed?: number | null;
					created_at?: string;
					emotion_anger?: number | null;
					emotion_anticipation?: number | null;
					emotion_disgust?: number | null;
					emotion_dominant?: string | null;
					emotion_entropy?: number | null;
					emotion_fear?: number | null;
					emotion_joy?: number | null;
					emotion_sadness?: number | null;
					emotion_surprise?: number | null;
					emotion_trust?: number | null;
					framework_version?: string | null;
					id?: string;
					representative_comments?: Json | null;
					updated_at?: string | null;
					valence_mean?: number | null;
					video_id: string;
				};
				Update: {
					age_20s?: number | null;
					age_30s?: number | null;
					age_40plus?: number | null;
					age_adult_ratio?: number | null;
					age_median?: number | null;
					age_teens?: number | null;
					analysis_model?: string | null;
					analyzed_at?: string | null;
					arousal_mean?: number | null;
					comments_analyzed?: number | null;
					created_at?: string;
					emotion_anger?: number | null;
					emotion_anticipation?: number | null;
					emotion_disgust?: number | null;
					emotion_dominant?: string | null;
					emotion_entropy?: number | null;
					emotion_fear?: number | null;
					emotion_joy?: number | null;
					emotion_sadness?: number | null;
					emotion_surprise?: number | null;
					emotion_trust?: number | null;
					framework_version?: string | null;
					id?: string;
					representative_comments?: Json | null;
					updated_at?: string | null;
					valence_mean?: number | null;
					video_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'content_community_metrics_video_id_fkey';
						columns: ['video_id'];
						isOneToOne: true;
						referencedRelation: 'summaries';
						referencedColumns: ['video_id'];
					}
				];
			};
			content_metric_keys: {
				Row: {
					category_hint: string | null;
					created_at: string;
					description: string;
					id: string;
					metric_type: string;
					name: string;
					name_ko: string;
					slug: string;
					updated_at: string;
					value_range: Json;
				};
				Insert: {
					category_hint?: string | null;
					created_at?: string;
					description: string;
					id?: string;
					metric_type?: string;
					name: string;
					name_ko: string;
					slug: string;
					updated_at?: string;
					value_range?: Json;
				};
				Update: {
					category_hint?: string | null;
					created_at?: string;
					description?: string;
					id?: string;
					metric_type?: string;
					name?: string;
					name_ko?: string;
					slug?: string;
					updated_at?: string;
					value_range?: Json;
				};
				Relationships: [];
			};
			content_metrics: {
				Row: {
					created_at: string;
					id: string;
					metrics: Json;
					updated_at: string;
					video_id: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					metrics?: Json;
					updated_at?: string;
					video_id: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					metrics?: Json;
					updated_at?: string;
					video_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'content_metrics_video_id_fkey';
						columns: ['video_id'];
						isOneToOne: true;
						referencedRelation: 'summaries';
						referencedColumns: ['video_id'];
					}
				];
			};
			profiles: {
				Row: {
					avatar_url: string | null;
					bio: string | null;
					created_at: string;
					display_name: string | null;
					id: string;
					updated_at: string | null;
					youtube_subscription_sync_status: string | null;
					youtube_subscription_synced_at: string | null;
				};
				Insert: {
					avatar_url?: string | null;
					bio?: string | null;
					created_at?: string;
					display_name?: string | null;
					id: string;
					updated_at?: string | null;
					youtube_subscription_sync_status?: string | null;
					youtube_subscription_synced_at?: string | null;
				};
				Update: {
					avatar_url?: string | null;
					bio?: string | null;
					created_at?: string;
					display_name?: string | null;
					id?: string;
					updated_at?: string | null;
					youtube_subscription_sync_status?: string | null;
					youtube_subscription_synced_at?: string | null;
				};
				Relationships: [];
			};
			subscriptions: {
				Row: {
					channel_id: string;
					created_at: string;
					description: string | null;
					id: string;
					published_at: string | null;
					resource_kind: string | null;
					subscribed_at: string | null;
					subscription_data: Json | null;
					thumbnail_url: string | null;
					title: string | null;
					updated_at: string | null;
					user_id: string;
				};
				Insert: {
					channel_id: string;
					created_at?: string;
					description?: string | null;
					id?: string;
					published_at?: string | null;
					resource_kind?: string | null;
					subscribed_at?: string | null;
					subscription_data?: Json | null;
					thumbnail_url?: string | null;
					title?: string | null;
					updated_at?: string | null;
					user_id: string;
				};
				Update: {
					channel_id?: string;
					created_at?: string;
					description?: string | null;
					id?: string;
					published_at?: string | null;
					resource_kind?: string | null;
					subscribed_at?: string | null;
					subscription_data?: Json | null;
					thumbnail_url?: string | null;
					title?: string | null;
					updated_at?: string | null;
					user_id?: string;
				};
				Relationships: [];
			};
			summaries: {
				Row: {
					analysis_model: string | null;
					analysis_status: string | null;
					analyzed_at: string | null;
					channel_id: string | null;
					channel_name: string | null;
					created_at: string;
					duration: number | null;
					id: string;
					insights: string | null;
					insights_audio_status: string | null;
					insights_audio_url: string | null;
					language: string | null;
					processing_status: string | null;
					summary: string | null;
					summary_audio_status: string | null;
					summary_audio_url: string | null;
					thumbnail_url: string | null;
					title: string | null;
					transcript: string | null;
					updated_at: string | null;
					video_id: string;
				};
				Insert: {
					analysis_model?: string | null;
					analysis_status?: string | null;
					analyzed_at?: string | null;
					channel_id?: string | null;
					channel_name?: string | null;
					created_at?: string;
					duration?: number | null;
					id?: string;
					insights?: string | null;
					insights_audio_status?: string | null;
					insights_audio_url?: string | null;
					language?: string | null;
					processing_status?: string | null;
					summary?: string | null;
					summary_audio_status?: string | null;
					summary_audio_url?: string | null;
					thumbnail_url?: string | null;
					title?: string | null;
					transcript?: string | null;
					updated_at?: string | null;
					video_id: string;
				};
				Update: {
					analysis_model?: string | null;
					analysis_status?: string | null;
					analyzed_at?: string | null;
					channel_id?: string | null;
					channel_name?: string | null;
					created_at?: string;
					duration?: number | null;
					id?: string;
					insights?: string | null;
					insights_audio_status?: string | null;
					insights_audio_url?: string | null;
					language?: string | null;
					processing_status?: string | null;
					summary?: string | null;
					summary_audio_status?: string | null;
					summary_audio_url?: string | null;
					thumbnail_url?: string | null;
					title?: string | null;
					transcript?: string | null;
					updated_at?: string | null;
					video_id?: string;
				};
				Relationships: [];
			};
			tags: {
				Row: {
					created_at: string;
					description: string | null;
					id: string;
					name: string;
					name_ko: string;
					slug: string;
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					description?: string | null;
					id?: string;
					name: string;
					name_ko: string;
					slug: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					description?: string | null;
					id?: string;
					name?: string;
					name_ko?: string;
					slug?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			transcripts: {
				Row: {
					created_at: string;
					data: Json;
					id: string;
					updated_at: string | null;
					video_id: string;
				};
				Insert: {
					created_at?: string;
					data: Json;
					id?: string;
					updated_at?: string | null;
					video_id: string;
				};
				Update: {
					created_at?: string;
					data?: Json;
					id?: string;
					updated_at?: string | null;
					video_id?: string;
				};
				Relationships: [];
			};
			video_categories: {
				Row: {
					category_id: string;
					created_at: string;
					id: string;
					priority: number;
					video_id: string;
				};
				Insert: {
					category_id: string;
					created_at?: string;
					id?: string;
					priority: number;
					video_id: string;
				};
				Update: {
					category_id?: string;
					created_at?: string;
					id?: string;
					priority?: number;
					video_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'video_categories_category_id_fkey';
						columns: ['category_id'];
						isOneToOne: false;
						referencedRelation: 'categories';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'video_categories_video_id_fkey';
						columns: ['video_id'];
						isOneToOne: false;
						referencedRelation: 'summaries';
						referencedColumns: ['video_id'];
					}
				];
			};
			video_tags: {
				Row: {
					created_at: string;
					id: string;
					tag_id: string;
					video_id: string;
					weight: number;
				};
				Insert: {
					created_at?: string;
					id?: string;
					tag_id: string;
					video_id: string;
					weight: number;
				};
				Update: {
					created_at?: string;
					id?: string;
					tag_id?: string;
					video_id?: string;
					weight?: number;
				};
				Relationships: [
					{
						foreignKeyName: 'video_tags_tag_id_fkey';
						columns: ['tag_id'];
						isOneToOne: false;
						referencedRelation: 'tags';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'video_tags_video_id_fkey';
						columns: ['video_id'];
						isOneToOne: false;
						referencedRelation: 'summaries';
						referencedColumns: ['video_id'];
					}
				];
			};
			videos: {
				Row: {
					available_countries: string[] | null;
					basic_info_synced_at: string | null;
					category: string | null;
					channel_id: string;
					channel_title: string | null;
					created_at: string;
					description: string | null;
					duration: string | null;
					is_family_safe: boolean | null;
					is_unlisted: boolean | null;
					last_analyzed_at: string | null;
					length_seconds: number | null;
					playlist_id: string | null;
					position: number | null;
					publish_date: string | null;
					published_at: string | null;
					sort_order: number | null;
					thumbnail_height: number | null;
					thumbnail_url: string | null;
					thumbnail_width: number | null;
					title: string;
					updated: string | null;
					updated_at: string | null;
					upload_date: string | null;
					video_data: Json | null;
					video_id: string;
					video_insight: Json | null;
					view_count: string | null;
				};
				Insert: {
					available_countries?: string[] | null;
					basic_info_synced_at?: string | null;
					category?: string | null;
					channel_id: string;
					channel_title?: string | null;
					created_at?: string;
					description?: string | null;
					duration?: string | null;
					is_family_safe?: boolean | null;
					is_unlisted?: boolean | null;
					last_analyzed_at?: string | null;
					length_seconds?: number | null;
					playlist_id?: string | null;
					position?: number | null;
					publish_date?: string | null;
					published_at?: string | null;
					sort_order?: number | null;
					thumbnail_height?: number | null;
					thumbnail_url?: string | null;
					thumbnail_width?: number | null;
					title: string;
					updated?: string | null;
					updated_at?: string | null;
					upload_date?: string | null;
					video_data?: Json | null;
					video_id: string;
					video_insight?: Json | null;
					view_count?: string | null;
				};
				Update: {
					available_countries?: string[] | null;
					basic_info_synced_at?: string | null;
					category?: string | null;
					channel_id?: string;
					channel_title?: string | null;
					created_at?: string;
					description?: string | null;
					duration?: string | null;
					is_family_safe?: boolean | null;
					is_unlisted?: boolean | null;
					last_analyzed_at?: string | null;
					length_seconds?: number | null;
					playlist_id?: string | null;
					position?: number | null;
					publish_date?: string | null;
					published_at?: string | null;
					sort_order?: number | null;
					thumbnail_height?: number | null;
					thumbnail_url?: string | null;
					thumbnail_width?: number | null;
					title?: string;
					updated?: string | null;
					updated_at?: string | null;
					upload_date?: string | null;
					video_data?: Json | null;
					video_id?: string;
					video_insight?: Json | null;
					view_count?: string | null;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			cleanup_stuck_processing: { Args: never; Returns: number };
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema['Enums']
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never = never
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema['CompositeTypes']
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never = never
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	graphql_public: {
		Enums: {}
	},
	public: {
		Enums: {}
	}
} as const;
