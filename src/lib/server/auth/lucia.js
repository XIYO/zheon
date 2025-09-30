import { lucia } from 'lucia';
import { sveltekit } from 'lucia/middleware';
import { d1 as createD1Adapter, betterSqlite3 as createSqliteAdapter } from '@lucia-auth/adapter-sqlite';
import { Argon2id } from 'oslo/password';
import { google as createGoogleProvider } from '@lucia-auth/oauth/providers';
import { dev } from '$app/environment';
import { env as privateEnv } from '$env/dynamic/private';

const D1_BINDING = 'DB';
export const SESSION_COOKIE_NAME = 'zheon_session';
export const OAUTH_STATE_COOKIE = 'oauth_state';

const passwordHasher = new Argon2id();
const TABLES = {
        user: 'users',
        session: 'sessions',
        key: 'keys'
};

const resolveSecret = (platformEnv, key) => {
        if (platformEnv && key in platformEnv) {
                return platformEnv[key];
        }
        if (privateEnv && key in privateEnv) {
                return privateEnv[key];
        }
        return undefined;
};

const createLocalDatabase = async () => {
        if (!globalThis.process?.versions?.node) {
                throw new Error('D1 binding is not available and Node.js fallback is unsupported in this environment.');
        }

        if (!globalThis.__zheonLocalDb) {
                const [{ default: Database }, { mkdirSync }, { dirname, join }] = await Promise.all([
                        import('better-sqlite3'),
                        import('node:fs'),
                        import('node:path')
                ]);

                const baseDir = globalThis.process?.cwd?.() ?? '.';
                const customPath = globalThis.process?.env?.LOCAL_SQLITE_PATH;
                const databasePath = customPath || join(baseDir, '.wrangler', 'local.sqlite');
                mkdirSync(dirname(databasePath), { recursive: true });

                const db = new Database(databasePath);
                db.pragma('journal_mode = WAL');
                globalThis.__zheonLocalDb = db;
        }

        return globalThis.__zheonLocalDb;
};

export const getDatabaseClient = async (platformEnv) => {
        if (platformEnv && platformEnv[D1_BINDING]) {
                const client = platformEnv[D1_BINDING];
                return {
                        type: 'd1',
                        client,
                        adapterFactory: () => createD1Adapter(client, TABLES)
                };
        }

        const client = await createLocalDatabase();
        return {
                type: 'sqlite',
                client,
                adapterFactory: () => createSqliteAdapter(client, TABLES)
        };
};

export const createAuth = async (platformEnv) => {
        const db = await getDatabaseClient(platformEnv);

        const auth = lucia({
                adapter: db.adapterFactory(),
                env: dev ? 'DEV' : 'PROD',
                middleware: sveltekit(),
                sessionCookie: {
                        name: SESSION_COOKIE_NAME,
                        attributes: {
                                sameSite: 'lax',
                                path: '/',
                                httpOnly: true,
                                secure: !dev
                        }
                },
                passwordHash: {
                        generate: (value) => passwordHasher.hash(value),
                        validate: (password, hash) => passwordHasher.verify(hash, password)
                },
                getUserAttributes: (attributes) => ({
                        email: attributes.email ?? null,
                        emailVerified: Boolean(attributes.email_verified),
                        displayName: attributes.display_name ?? null,
                        pictureUrl: attributes.picture_url ?? null,
                        locale: attributes.locale ?? null
                }),
                getSessionAttributes: () => ({})
        });

        const getGoogleProvider = (redirectUri) => {
                const clientId = resolveSecret(platformEnv, 'GOOGLE_CLIENT_ID');
                const clientSecret = resolveSecret(platformEnv, 'GOOGLE_CLIENT_SECRET');

                if (!clientId || !clientSecret) {
                        throw new Error('Google OAuth 환경 변수가 설정되지 않았습니다.');
                }

                return createGoogleProvider(auth, {
                        clientId,
                        clientSecret,
                        redirectUri,
                        accessType: 'offline',
                        scope: [
                                'https://www.googleapis.com/auth/youtube.readonly',
                                'openid',
                                'email',
                                'profile'
                        ]
                });
        };

        return { auth, db, getGoogleProvider };
};
