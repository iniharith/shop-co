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
        const host = req.nextUrl.hostname;
        const forwardedProto = req.headers.get("x-forwarded-proto");

        if (host === "www.kampungcetak.com" || (host === "kampungcetak.com" && forwardedProto === "http")) {
            const canonicalUrl = new URL(req.nextUrl.pathname + req.nextUrl.search, "https://kampungcetak.com");
            return NextResponse.redirect(canonicalUrl, 301);
        }

        if (req.nextUrl.pathname === "/home") {
            return NextResponse.redirect(new URL("/", req.url), 301);
        }

        if (req.nextUrl.pathname.startsWith("/task-access/")) {
            const headers = new Headers(req.headers);
            headers.set("x-kc-task-access", "1");
            return NextResponse.next({ request: { headers } });
        }
        const protectedRoutes = ["/home/cart", "/home/profile"];
        const isProtectedRoute = protectedRoutes.some((route) =>
            req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(`${route}/`)
        );

        // email.kampungcetak.com → webmail
        if (host === "diy.kampungcetak.com" && req.nextUrl.pathname === "/") {
            return NextResponse.rewrite(new URL("/diy", req.url));
        }
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
    matcher: ["/((?!api|_next|favicon.ico|robots.txt|sitemap.xml).*)"],
};
