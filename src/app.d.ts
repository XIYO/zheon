import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';

declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
			details?: string;
			hint?: string;
		}

		interface Locals {
			supabase: SupabaseClient<Database>;
			adminSupabase: SupabaseClient<Database>;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			session: Session | null;
			user: User | null;
		}
		interface PageData {
			session: Session | null;
			supabase: SupabaseClient<Database>;
			user: User | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
