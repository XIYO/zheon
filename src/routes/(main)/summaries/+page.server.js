import { error } from '@sveltejs/kit';

const SELECT_USER_SUMMARIES = `
        SELECT id, url, title, summary, created_at
        FROM summaries
        WHERE user_id = ?
        ORDER BY created_at DESC
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

const fetchUserSummaries = async (db, userId) => {
        if (db.type === 'd1') {
                const result = await db.client.prepare(SELECT_USER_SUMMARIES).bind(userId).all();
                return result.results ?? [];
        }

        return db.client.prepare(SELECT_USER_SUMMARIES).all(userId);
};

export const load = async (event) => {
        event.depends('summaries:list');

        const session = event.locals.session ?? (await event.locals.auth.validate());
        if (!session) {
                throw error(401, '로그인이 필요합니다.');
        }

        try {
                const rows = await fetchUserSummaries(event.locals.db, session.user.userId);
                const summaries = rows.map((row) => ({
                        id: row.id,
                        url: row.url,
                        title: row.title,
                        summary: row.summary,
                        created_at: toIso(row.created_at)
                }));

                return {
                        meta: {
                                title: '인사이트',
                                description: '지금까지 정리한 모든 영상 인사이트를 확인하세요'
                        },
                        summaries
                };
        } catch (fetchError) {
                console.error('Error fetching summaries:', fetchError);
                throw error(500, '요약 데이터를 불러오지 못했습니다.');
        }
};
