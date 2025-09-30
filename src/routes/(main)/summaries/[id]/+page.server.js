import { error } from '@sveltejs/kit';

const SELECT_SUMMARY = `
        SELECT id, user_id, url, title, summary, content, lang, created_at
        FROM summaries
        WHERE id = ?
`;

const toIso = (value) => {
        if (value === null || value === undefined) {
                return null;
        }

        if (typeof value === 'number') {
                return new Date(value * 1000).toISOString();
        }

        const numeric = Number(value);
        if (!Number.isNaN(numeric)) {
                return new Date(numeric * 1000).toISOString();
        }

        return value;
};

const getSummary = async (db, id) => {
        if (db.type === 'd1') {
            const result = await db.client.prepare(SELECT_SUMMARY).bind(id).first();
            return result ?? null;
        }

        const row = db.client.prepare(SELECT_SUMMARY).get(id);
        return row ?? null;
};

export const load = async (event) => {
        const session = event.locals.session ?? (await event.locals.auth.validate());
        if (!session) {
                throw error(401, '로그인이 필요합니다.');
        }

        const summary = await getSummary(event.locals.db, event.params.id);
        if (!summary) {
                throw error(404, 'Summary not found');
        }

        if (summary.user_id && summary.user_id !== session.user.userId) {
                throw error(403, '접근 권한이 없습니다.');
        }

        return {
                meta: {
                        title: summary.title
                },
                summary: {
                        id: summary.id,
                        url: summary.url,
                        title: summary.title,
                        summary: summary.summary,
                        content: summary.content,
                        lang: summary.lang,
                        created_at: toIso(summary.created_at)
                }
        };
};
