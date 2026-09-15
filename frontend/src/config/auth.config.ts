/**
 * Coded by Harith
 * Kampungcetak ®
 */
// client/auth.config.ts
import { AuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const authConfig: AuthOptions = {
    providers: [
        GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID || "", clientSecret: process.env.GOOGLE_CLIENT_SECRET || "" }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "your@email.com" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
                const response = await fetch(`${backendUrl}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: credentials.email, password: credentials.password }),
                    signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(15_000) : (() => { const c = new AbortController(); setTimeout(() => c.abort(), 15_000); return c.signal; })(),
                    cache: 'no-store',
                });
                if (!response.ok) return null;
                const data = await response.json();
                if (!data?.user?._id || !data?.accessToken) return null;
                return {
                    id: data.user._id,
                    name: data.user.name,
                    email: data.user.email,
                    token: data.accessToken,
                    avatar: data.user.avatar || '',
                } as User & { avatar?: string };
            }
        }),
    ],
    session: {
        strategy: "jwt"
    },
    cookies: {
        // Add custom cookie configuration
        sessionToken: {
            name: `client-session-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
        callbackUrl: {
            name: `client-callback-url`,
            options: {
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
        csrfToken: {
            name: `client-csrf-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google" && user.email) {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/auth/google`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, name: user.name, avatar: user.image }) });
                if (!response.ok) return false;
                const data = await response.json();
                user.id = data.user._id; (user as any).token = data.accessToken; (user as any).avatar = data.user.avatar || user.image || '';
            }
            return true;
        },
        jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.token = user.token;
                token.name = user.name;
                token.email = user.email;
                token.avatar = (user as any).avatar;
            }

            if (trigger === "update" && session) {
                if (session.orderSuccesPageAccess !== undefined) {
                    token.orderSuccesPageAccess = session.orderSuccesPageAccess;
                }
                if (session.name !== undefined) token.name = session.name;
                if (session.avatar !== undefined) token.avatar = session.avatar;
            }

            return token;
        },
        redirect({ url, baseUrl }) {
            baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL as string;
            return url.startsWith(baseUrl) ? url : `${baseUrl}/`;
        },
        session({ session, token }) {
            session.user.token = token.token as string;
            session.user.id = token.id as string;
            session.user.name = token.name as string;
            session.user.email = token.email as string;
            session.user.orderSuccesPageAccess = token.orderSuccesPageAccess as boolean;
            (session.user as any).avatar = token.avatar as string;

            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET || "client"
};

declare module "next-auth" {
    interface Session {
        user: {
            token: string;
            id: string;
            name: string;
            email: string;
            orderSuccesPageAccess: boolean;
            avatar?: string;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        token: string;
        id: string;
        name: string;
        email: string;
        orderSuccesPageAccess: boolean;
        avatar?: string;
    }
}

declare module "next-auth" {
    interface User {
        token: string;
        id: string;
        name: string;
        email: string;
        avatar?: string;
    }
}
