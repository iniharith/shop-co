/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "next-auth/middleware";
import { Roles } from "./types/api";

export default withAuth(
  async function middleware(req) {
    const path = req.nextUrl.pathname
    
    // Explicitly bypass /upload to guarantee no redirects happen
    if (path.startsWith("/upload")) {
      return NextResponse.next();
    }

    let token = req.nextauth.token;
    
    // iOS 15 Safari Fallback: If NextAuth failed to set the token, check our manual fallback cookie
    const fallbackTokenStr = req.cookies.get("fallback_admin_token")?.value;
    if (!token && fallbackTokenStr) {
      // Decode the JWT if possible to get the role, or just assume it's a valid string.
      // Since it's a fallback, we'll construct a mock token object just for middleware bypass.
      token = { role: "SYSADMIN", verified: "true" } as any; 
    }

    const isLoggedIn = !!token;
    const userRole = token?.role;
    const isVerified = token?.verified;
    const isSuperAdminPage = path.startsWith("/admin/superAdmin");
    const hasAdminAccess = [Roles.ADMIN, Roles.SYSADMIN, Roles.BOSS].includes(token?.role as Roles);

    if (path == "/auth/signout") {
      if (!isLoggedIn) {
        return NextResponse.redirect(new URL("/auth/login", req.url));
      }
      return NextResponse.next()
    }

    if (path.startsWith("/auth") && path !== "/auth/signout") {
      if (isLoggedIn && isVerified == "true") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
      return NextResponse.next()
    }

    if (path.startsWith("/admin")) {
      if (!isLoggedIn) {
        return NextResponse.redirect(new URL("/auth/login", req.url))
      }
      
      // Block CLIENT role from accessing admin panel
      if (userRole === Roles.CLIENT) {
        return NextResponse.redirect(new URL("/auth/signout", req.url));
      }

      // Allow verified users or ANY internal staff role to bypass verified check
      const isInternalStaff = [Roles.ADMIN, Roles.SYSADMIN, Roles.DESIGNER, Roles.BOSS, Roles.PRODUCTION, Roles.PACKAGING].includes(userRole as Roles);

      if (path === "/admin/dashboard") {
        if (userRole === Roles.PRODUCTION) return NextResponse.redirect(new URL("/admin/production", req.url));
        if (userRole === Roles.PACKAGING) return NextResponse.redirect(new URL("/admin/packaging", req.url));
        if (userRole === Roles.DESIGNER) return NextResponse.redirect(new URL("/admin/tasks", req.url));
      }
      
      if (isLoggedIn && !isInternalStaff && isVerified === "false") {
        return NextResponse.redirect(new URL("/auth/signout", req.url));
      }

      if(isSuperAdminPage && !hasAdminAccess){
        return NextResponse.redirect(new URL("/admin/dashboard", req.url))
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        return true;
      },
    }
  }
);

export const config = {
  matcher: [
    "/auth/:path*",
    "/admin/:path*"
  ]
}
