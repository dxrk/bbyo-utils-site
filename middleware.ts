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
  try {
    const { pathname } = request.nextUrl;

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

    // Require authentication for all /utils/* pages
    if (pathname.startsWith("/utils/")) {
      try {
        const token = await getToken({
          req: request,
          secret: process.env.NEXTAUTH_SECRET,
        });

        if (!token) {
          return NextResponse.redirect(new URL("/", request.url));
        }
      } catch (error) {
        console.error("Error verifying authentication token:", error);
        return NextResponse.redirect(new URL("/error", request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.redirect(new URL("/error", request.url));
  }
}

export const config = {
  matcher: ["/utils/:path*"],
};
