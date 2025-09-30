import { redirect, error as kitError } from '@sveltejs/kit';

const UPSERT_GOOGLE_ACCOUNT = `
        INSERT INTO google_accounts (
                user_id,
                google_user_id,
                email,
                email_verified,
                given_name,
                family_name,
                picture_url,
                locale,
                access_token,
                refresh_token,
                access_token_expires_at,
                scope
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(google_user_id) DO UPDATE SET
                user_id = excluded.user_id,
                email = excluded.email,
                email_verified = excluded.email_verified,
                given_name = excluded.given_name,
                family_name = excluded.family_name,
                picture_url = excluded.picture_url,
                locale = excluded.locale,
                access_token = excluded.access_token,
                refresh_token = COALESCE(excluded.refresh_token, google_accounts.refresh_token),
                access_token_expires_at = excluded.access_token_expires_at,
                scope = excluded.scope,
                updated_at = strftime('%s','now')
`;

const upsertGoogleAccount = async (db, values) => {
        if (db.type === 'd1') {
                await db.client.prepare(UPSERT_GOOGLE_ACCOUNT).bind(...values).run();
                return;
        }

        const statement = db.client.prepare(UPSERT_GOOGLE_ACCOUNT);
        statement.run(...values);
};

export const GET = async (event) => {
        const code = event.url.searchParams.get('code');
        const state = event.url.searchParams.get('state');

        const statePayload = event.locals.validateOAuthState(state);
        if (!statePayload || !code) {
                throw kitError(400, 'OAuth 상태가 유효하지 않습니다.');
        }

        const redirectTo = statePayload.redirectTo ?? '/';
        const callbackUrl = new URL('/auth/sign-in/google/callback', event.url.origin).toString();

        let googleAuth;
        try {
                googleAuth = event.locals.getGoogleProvider(callbackUrl);
        } catch (error) {
                console.error('Google OAuth 설정 오류:', error);
                throw kitError(500, 'OAuth 제공자를 초기화할 수 없습니다.');
        }

        try {
                const result = await googleAuth.validateCallback(code);
                const { googleUser, googleTokens, existingUser, createUser } = result;

                const expiresAt = googleTokens.accessTokenExpiresIn
                        ? Math.floor(Date.now() / 1000) + googleTokens.accessTokenExpiresIn
                        : null;
                const scope = [
                        'https://www.googleapis.com/auth/youtube.readonly',
                        'openid',
                        'email',
                        'profile'
                ].join(' ');

                let user = existingUser;
                if (!user) {
                        user = await createUser({
                                attributes: {
                                        email: googleUser.email ?? null,
                                        email_verified: googleUser.email_verified ? 1 : 0,
                                        display_name: googleUser.name ?? null,
                                        picture_url: googleUser.picture ?? null,
                                        locale: googleUser.locale ?? null
                                }
                        });
                } else {
                        await event.locals.lucia.updateUserAttributes(user.userId, {
                                email: googleUser.email ?? user.email,
                                email_verified: googleUser.email_verified ? 1 : 0,
                                display_name: googleUser.name ?? user.displayName,
                                picture_url: googleUser.picture ?? user.pictureUrl,
                                locale: googleUser.locale ?? user.locale
                        });
                }

                await upsertGoogleAccount(event.locals.db, [
                        user.userId,
                        googleUser.sub,
                        googleUser.email ?? null,
                        googleUser.email_verified ? 1 : 0,
                        googleUser.given_name ?? null,
                        googleUser.family_name ?? null,
                        googleUser.picture ?? null,
                        googleUser.locale ?? null,
                        googleTokens.accessToken,
                        googleTokens.refreshToken ?? null,
                        expiresAt,
                        scope
                ]);

                const session = await event.locals.lucia.createSession({
                        userId: user.userId,
                        attributes: {}
                });
                event.locals.auth.setSession(session);

                throw redirect(303, redirectTo);
        } catch (error) {
                console.error('Google OAuth 콜백 처리 실패:', error);
                throw kitError(500, 'Google OAuth 처리에 실패했습니다.');
        }
};
