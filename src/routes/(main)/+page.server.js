import { fail, redirect } from '@sveltejs/kit';
import { urlSchema } from '$lib/schemas/url.js';

const SELECT_BY_URL = `
        SELECT id
        FROM summaries
        WHERE url = ?
`;

const INSERT_SUMMARY = `
        INSERT INTO summaries (user_id, url, title, summary, content, lang)
        VALUES (?, ?, ?, ?, ?, ?)
`;

const selectByUrl = async (db, url) => {
        if (db.type === 'd1') {
                const row = await db.client.prepare(SELECT_BY_URL).bind(url).first();
                return row ?? null;
        }

        return db.client.prepare(SELECT_BY_URL).get(url) ?? null;
};

const insertSummary = async (db, values) => {
        if (db.type === 'd1') {
                const result = await db.client.prepare(INSERT_SUMMARY).bind(...values).run();
                return result.meta?.last_row_id ?? null;
        }

        const statement = db.client.prepare(INSERT_SUMMARY);
        const result = statement.run(...values);
        return result.lastInsertRowid ?? null;
};

export const actions = {
        default: async (event) => {
                const { request, url, locals } = event;
                const session = locals.session ?? (await locals.auth.validate());

                if (!session) {
                        const redirectTo = url.pathname;
                        throw redirect(303, `/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`);
                }

                const formData = await request.formData();
                const youtubeUrl = formData.get('youtubeUrl')?.toString().trim();

                const validation = urlSchema.safeParse(youtubeUrl);
                if (!validation.success) {
                        const issue = validation.error.issues?.[0];
                        return fail(400, {
                                message: issue?.message ?? 'URL을 확인해주세요.',
                                type: 'validation_error'
                        });
                }

                try {
                        const existing = await selectByUrl(locals.db, validation.data);
                        if (existing) {
                                return {
                                        success: true,
                                        fromCache: true,
                                        recordId: existing.id
                                };
                        }

                        const placeholderSummary = '요약이 준비 중입니다. 잠시 후 다시 확인해주세요.';
                        const recordId = await insertSummary(locals.db, [
                                session.user.userId,
                                validation.data,
                                '요약 생성 대기 중',
                                placeholderSummary,
                                placeholderSummary,
                                'ko'
                        ]);

                        return {
                                success: true,
                                fromCache: false,
                                recordId
                        };
                } catch (fetchError) {
                        console.error('Failed to create summary:', fetchError);
                        return fail(500, {
                                message: '요약을 생성하는 중 문제가 발생했습니다.',
                                type: 'database_error'
                        });
                }
        }
};
