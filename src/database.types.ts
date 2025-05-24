export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
	public: {
		Tables: {
			summary: {
				Row: {
					id: number;
					created_at: string;
					youtube_url: string;
					lang: string;
					summary: string;
					user_id: string;
				};
				Insert: {
					id?: number;
					created_at?: string;
					youtube_url: string;
					lang: string;
					summary: string;
					user_id: string;
				};
				Update: {
					id?: number;
					created_at?: string;
					youtube_url?: string;
					lang?: string;
					summary?: string;
					user_id?: string;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
}
