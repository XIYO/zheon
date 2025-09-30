declare global {
        namespace Lucia {
                type Auth = import('lucia').Auth;
                type DatabaseSessionAttributes = Record<string, never>;
                interface DatabaseUserAttributes {
                        email: string | null;
                        email_verified: number;
                        display_name: string | null;
                        picture_url: string | null;
                        locale: string | null;
                }
        }
}
