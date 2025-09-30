import { paraglideMiddleware } from '$lib/paraglide/server';
import { sequence } from '@sveltejs/kit/hooks';
import { dev } from '$app/environment';
import { createAuth, OAUTH_STATE_COOKIE } from '$lib/server/auth/lucia';

const handleParaglide = ({ event, resolve }) =>
        paraglideMiddleware(event.request, ({ request, locale }) => {
                event.request = request;

                return resolve(event, {
                        transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
                });
        });

const createOAuthStateManager = (event) => {
        const cookieAttributes = {
                path: '/',
                httpOnly: true,
                secure: !dev,
                sameSite: 'lax',
                maxAge: 60 * 10 // 10 minutes
        };

        return {
                issue: ({ redirectTo = null } = {}) => {
                        const state = crypto.randomUUID().replace(/-/g, '');
                        const payload = JSON.stringify({ state, redirectTo });
                        event.cookies.set(OAUTH_STATE_COOKIE, payload, cookieAttributes);
                        return state;
                },
                validate: (state) => {
                        const stored = event.cookies.get(OAUTH_STATE_COOKIE);
                        event.cookies.delete(OAUTH_STATE_COOKIE, { path: '/' });

                        if (!stored || !state) {
                                return null;
                        }

                        try {
                                const parsed = JSON.parse(stored);
                                if (parsed?.state !== state) {
                                        return null;
                                }

                                return {
                                        redirectTo: parsed?.redirectTo ?? null
                                };
                        } catch (error) {
                                console.error('OAuth state 파싱 실패:', error);
                                return null;
                        }
                }
        };
};

const luciaHandle = async ({ event, resolve }) => {
        const { auth, db, getGoogleProvider } = await createAuth(event.platform?.env ?? null);
        const authRequest = auth.handleRequest(event);
        const stateManager = createOAuthStateManager(event);

        event.locals.auth = authRequest;
        event.locals.lucia = auth;
        event.locals.db = db;
        event.locals.getGoogleProvider = getGoogleProvider;
        event.locals.issueOAuthState = stateManager.issue;
        event.locals.validateOAuthState = stateManager.validate;

        const session = await authRequest.validate();
        event.locals.session = session;
        event.locals.user = session?.user ?? null;

        return resolve(event);
};

export const handle = sequence(handleParaglide, luciaHandle);
