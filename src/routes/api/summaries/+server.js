import { json } from '@sveltejs/kit';

const SELECT_SUMMARIES = `
        SELECT id, url, title, summary, lang, created_at, last_modified_at
        FROM summaries
        ORDER BY last_modified_at DESC
`;

const normalizeTimestamp = (value) => {
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

const mapSummary = (row) => ({
        id: row.id,
        url: row.url,
        title: row.title,
        summary: row.summary,
        lang: row.lang,
        created_at: normalizeTimestamp(row.created_at),
        last_modified_at: normalizeTimestamp(row.last_modified_at)
});

export const GET = async ({ locals }) => {
        try {
                const { type, client } = locals.db;
                let rows = [];

                if (type === 'd1') {
                        const result = await client.prepare(SELECT_SUMMARIES).all();
                        rows = result.results ?? [];
                } else {
                        rows = client.prepare(SELECT_SUMMARIES).all();
                }

                return json({ summaries: rows.map(mapSummary) });
        } catch (error) {
                console.error('요약 데이터를 불러오는 중 오류 발생:', error);
                return json({ summaries: [] }, { status: 500 });
        }
};
