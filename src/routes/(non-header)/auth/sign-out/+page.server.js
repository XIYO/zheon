import { redirect } from '@sveltejs/kit';

export const actions = {
        default: async ({ locals }) => {
                const session = locals.session ?? (await locals.auth.validate());
                if (session) {
                        await locals.lucia.invalidateSession(session.sessionId);
                        locals.auth.setSession(null);
                }

                throw redirect(303, '/');
        }
};
