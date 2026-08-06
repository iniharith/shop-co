/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function proxy(req) {
        const token = req.nextauth.token;
        const isLoggedIn = !!token;
        const protectedRoutes = ["/home/cart", "/home/profile"];
        const isProtectedRoute = protectedRoutes.some((route) =>
            req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(`${route}/`)
        );

        // email.kampungcetak.com → webmail
        const host = req.nextUrl.hostname;
        if (host === "email.kampungcetak.com" && req.nextUrl.pathname === "/") {
            return NextResponse.redirect(new URL("/email", req.url));
        }
        if (host === "email.kampungcetak.com" && !req.nextUrl.pathname.startsWith("/email")) {
            return NextResponse.redirect(new URL("/email", req.url));
        }

        if (!isLoggedIn && isProtectedRoute) {
            return NextResponse.redirect(new URL("/", req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => {

                return true;
            },
        },

        cookies: {
            sessionToken: {
                name: `client-session-token`
            }
        }
    }
);

export const config = {
    matcher: ["/home/cart/:path*", "/home/profile/:path*", "/email/:path*"],
};
