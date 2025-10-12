export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	// Allows to automatically instanciate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: '12.2.12 (cd3cf9e)';
	};
	public: {
		Tables: {
			subtitles: {
				Row: {
					created_at: string | null;
					id: number;
					lang: string;
					subtitle: string;
					url: string;
				};
				Insert: {
					created_at?: string | null;
					id?: number;
					lang?: string;
					subtitle: string;
					url: string;
				};
				Update: {
					created_at?: string | null;
					id?: number;
					lang?: string;
					subtitle?: string;
					url?: string;
				};
				Relationships: [];
			};
			summary: {
				Row: {
					id: string;
					url: string;
					title: string | null;
					channel_id: string | null;
					channel_name: string | null;
					duration: number | null;
					transcript: string | null;
					summary: string | null;
					insights: string | null;
					language: string;
					processing_status: string;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					url: string;
					title?: string | null;
					channel_id?: string | null;
					channel_name?: string | null;
					duration?: number | null;
					transcript?: string | null;
					summary?: string | null;
					insights?: string | null;
					language?: string;
					processing_status?: string;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					url?: string;
					title?: string | null;
					channel_id?: string | null;
					channel_name?: string | null;
					duration?: number | null;
					transcript?: string | null;
					summary?: string | null;
					insights?: string | null;
					language?: string;
					processing_status?: string;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			channels: {
				Row: {
					channel_id: string;
					channel_name: string;
					channel_avatar: string | null;
					subscriber_count: number | null;
					video_count: number | null;
					description: string | null;
					channel_data: any | null;
					is_recommended: boolean;
					created_at: string;
					updated_at: string;
					expires_at: string;
				};
				Insert: {
					channel_id: string;
					channel_name: string;
					channel_avatar?: string | null;
					subscriber_count?: number | null;
					video_count?: number | null;
					description?: string | null;
					channel_data?: any | null;
					is_recommended?: boolean;
					created_at?: string;
					updated_at?: string;
					expires_at?: string;
				};
				Update: {
					channel_id?: string;
					channel_name?: string;
					channel_avatar?: string | null;
					subscriber_count?: number | null;
					video_count?: number | null;
					description?: string | null;
					channel_data?: any | null;
					is_recommended?: boolean;
					created_at?: string;
					updated_at?: string;
					expires_at?: string;
				};
				Relationships: [];
			};
			channel_videos: {
				Row: {
					channel_id: string;
					video_id: string;
					video_data: any;
					created_at: string;
					updated_at: string;
					expires_at: string;
				};
				Insert: {
					channel_id: string;
					video_id: string;
					video_data: any;
					created_at?: string;
					updated_at?: string;
					expires_at?: string;
				};
				Update: {
					channel_id?: string;
					video_id?: string;
					video_data?: any;
					created_at?: string;
					updated_at?: string;
					expires_at?: string;
				};
				Relationships: [];
			};
			user_subscriptions: {
				Row: {
					id: string;
					user_id: string;
					channel_id: string;
					subscribed_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					channel_id: string;
					subscribed_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					channel_id?: string;
					subscribed_at?: string;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			binary_quantize: {
				Args: { '': string } | { '': unknown };
				Returns: unknown;
			};
			cleanup_expired_cache: {
				Args: Record<PropertyKey, never>;
				Returns: undefined;
			};
			check_existing_summary: {
				Args: { p_url: string };
				Returns: string | null;
			};
			cleanup_expired_data: {
				Args: Record<PropertyKey, never>;
				Returns: undefined;
			};
			halfvec_avg: {
				Args: { '': number[] };
				Returns: unknown;
			};
			halfvec_out: {
				Args: { '': unknown };
				Returns: unknown;
			};
			halfvec_send: {
				Args: { '': unknown };
				Returns: string;
			};
			halfvec_typmod_in: {
				Args: { '': unknown[] };
				Returns: number;
			};
			hnsw_bit_support: {
				Args: { '': unknown };
				Returns: unknown;
			};
			hnsw_halfvec_support: {
				Args: { '': unknown };
				Returns: unknown;
			};
			hnsw_sparsevec_support: {
				Args: { '': unknown };
				Returns: unknown;
			};
			hnswhandler: {
				Args: { '': unknown };
				Returns: unknown;
			};
			ivfflat_bit_support: {
				Args: { '': unknown };
				Returns: unknown;
			};
			ivfflat_halfvec_support: {
				Args: { '': unknown };
				Returns: unknown;
			};
			ivfflathandler: {
				Args: { '': unknown };
				Returns: unknown;
			};
			l2_norm: {
				Args: { '': unknown } | { '': unknown };
				Returns: number;
			};
			l2_normalize: {
				Args: { '': string } | { '': unknown } | { '': unknown };
				Returns: unknown;
			};
			match_knowledge_vectors: {
				Args: {
					query_embedding: string;
					match_threshold?: number;
					match_count?: number;
					filter_domain?: string;
				};
				Returns: {
					id: string;
					content: string;
					domain: string;
					metadata: Json;
					similarity: number;
				}[];
			};
			sparsevec_out: {
				Args: { '': unknown };
				Returns: unknown;
			};
			sparsevec_send: {
				Args: { '': unknown };
				Returns: string;
			};
			sparsevec_typmod_in: {
				Args: { '': unknown[] };
				Returns: number;
			};
			vector_avg: {
				Args: { '': number[] };
				Returns: string;
			};
			vector_dims: {
				Args: { '': string } | { '': unknown };
				Returns: number;
			};
			vector_norm: {
				Args: { '': string };
				Returns: number;
			};
			vector_out: {
				Args: { '': string };
				Returns: unknown;
			};
			vector_send: {
				Args: { '': string };
				Returns: string;
			};
			vector_typmod_in: {
				Args: { '': unknown[] };
				Returns: number;
			};
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
	public: {
		Enums: {}
	}
} as const;
