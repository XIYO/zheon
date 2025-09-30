import type { AuthRequest, Session, User } from 'lucia';
import type { createAuth, getDatabaseClient } from '$lib/server/auth/lucia';

declare global {
        namespace App {
                interface Error {
                        code: string;
                        id: string;
                }

                interface Locals {
                        auth: AuthRequest;
                        lucia: Awaited<ReturnType<typeof createAuth>>['auth'];
                        db: Awaited<ReturnType<typeof getDatabaseClient>>;
                        session: Session | null;
                        user: User | null;
                        getGoogleProvider: Awaited<ReturnType<typeof createAuth>>['getGoogleProvider'];
                        issueOAuthState: (options: { redirectTo?: string | null }) => string;
                        validateOAuthState: (state: string | null) => { redirectTo: string | null } | null;
                }
                interface PageData {
                        session: Session | null;
                        user: User | null;
                }
                // interface PageState {}
                // interface Platform {}
        }
}

export {};
