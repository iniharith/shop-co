/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authConfig: AuthOptions = {
  providers: [
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
          token: data.accessToken,
          refreshToken: data.refreshToken,
          id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          verified: data.user.verified,
          avatar: data.user.avatar || '',
        };
      }
    }),
  ],
  pages: {
    signIn: "/auth/login"
  },
  session: {
    strategy: "jwt"
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.token = user.token;
        token.refreshToken = (user as any).refreshToken;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.verified = user.verified;
        token.avatar = (user as any).avatar;
      }
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.avatar !== undefined) token.avatar = session.avatar;
        if ((session as any).token !== undefined) token.token = (session as any).token;
        if ((session as any).refreshToken !== undefined) token.refreshToken = (session as any).refreshToken;
      }
      return token;
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {}
      return `${baseUrl}/auth/login`;
    },
    session({ session, token }) {
      session.user.token = token.token as string;
      (session.user as any).refreshToken = token.refreshToken as string;
      session.user.id = token.id as string;
      session.user.name = token.name as string;
      session.user.email = token.email as string;
      session.user.role = token.role as string;
      session.user.verified = token.verified as string;
      (session.user as any).avatar = token.avatar as string;

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "admin"
};

declare module "next-auth" {
  interface Session {
    user: {
      token: string;
      refreshToken?: string;
      id: string;
      name: string;
      email: string;
      role: string;
      verified: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    token: string;
    refreshToken?: string;
    id: string;
    name: string;
    email: string;
    role: string;
    verified: string;
    avatar?: string;
  }
}

declare module "next-auth" {
  interface User {
    token: string;
    refreshToken?: string;
    id: string;
    name: string;
    email: string;
    role: string;
    verified: string;
  }
}
