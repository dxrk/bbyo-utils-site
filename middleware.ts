import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// List of deprecated tool routes
const deprecatedRoutes = ["/utils/summer-crm", "/utils/ic-launch"];

// Validate environment variables
if (!process.env.DEPRECATED_TOOLS_PASSWORD) {
  console.error("DEPRECATED_TOOLS_PASSWORD environment variable is not set");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    // Skip auth check for auth-related routes and static files
    if (
      pathname.startsWith("/api/auth") ||
      pathname.startsWith("/_next") ||
      pathname === "/favicon.ico"
    ) {
      return NextResponse.next();
    }

    // Get the token first to avoid unnecessary checks
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Check if the route is deprecated
    if (deprecatedRoutes.includes(pathname)) {
      // Check if the user has provided the correct password
      const password = request.cookies.get("deprecated_tools_password")?.value;
      const correctPassword = process.env.DEPRECATED_TOOLS_PASSWORD;

      if (!correctPassword) {
        console.error("DEPRECATED_TOOLS_PASSWORD is not set");
        return NextResponse.redirect(new URL("/error", request.url));
      }

      if (!password || password !== correctPassword) {
        // Redirect to password page if no valid password is found
        const url = request.nextUrl.clone();
        url.pathname = "/utils/password-protected";
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
      }
    }

    // Require authentication for all /utils/* and /api/* pages
    if (pathname.startsWith("/utils/") || pathname.startsWith("/api/")) {
      if (!token) {
        // For API routes, return 401 instead of redirecting
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        // For web routes, redirect to home page
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
    return NextResponse.redirect(new URL("/error", request.url));
  }
}

export const config = {
  matcher: [
    "/utils/:path*",
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
