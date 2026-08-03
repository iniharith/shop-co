/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { NextResponse } from "next/server"
import { withAuth } from "next-auth/middleware";
import { Roles } from "./types/api";

export default withAuth(
  async function proxy(req) {
    const path = req.nextUrl.pathname
    
    // Explicitly bypass /upload to guarantee no redirects happen
    if (path.startsWith("/upload")) {
      return NextResponse.next();
    }

    const token = req.nextauth.token;

    const isLoggedIn = !!token;
    const userRole = token?.role;
    // The backend user field is boolean; the JWT declaration is stale and says string.
    const isVerified = (token?.verified as unknown) === true;
    const isSuperAdminPage = path.startsWith("/admin/superAdmin");
    const hasAdminAccess = [Roles.ADMIN, Roles.SYSADMIN, Roles.BOSS].includes(token?.role as Roles);

    if (path == "/auth/signout") {
      if (!isLoggedIn) {
        return NextResponse.redirect(new URL("/auth/login", req.url));
      }
      return NextResponse.next()
    }

    if (path.startsWith("/auth") && path !== "/auth/signout") {
      if (isLoggedIn && isVerified) {
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
      
      if (isLoggedIn && !isInternalStaff && !isVerified) {
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
