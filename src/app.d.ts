import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';
import type { Innertube } from 'youtubei.js';

declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
			details?: string;
			hint?: string;
		}

		interface Locals {
			supabase: SupabaseClient<Database, 'public', any>;
			adminSupabase: SupabaseClient<Database, 'public', any>;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			session: Session | null;
			user: User | null;
			youtube: Innertube | null;
		}
		interface PageData {
			session: Session | null;
			supabase: SupabaseClient<Database, 'public', any>;
			user: User | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
