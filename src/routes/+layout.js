/** @type {import('./$types').LayoutServerLoad} */
export const load = async ({ locals, depends }) => {
        depends('lucia:auth');

        const session = locals.session ?? (await locals.auth.validate());
        const user = session?.user ?? locals.user ?? null;

        return { session, user };
};
