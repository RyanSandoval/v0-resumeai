import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { adminMiddleware } from "./middleware/admin-middleware"

export async function middleware(request: NextRequest) {
  // Log authentication-related requests for debugging
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    console.log(`Auth request: ${request.method} ${request.nextUrl.pathname}`)
  }

  // Check if the request is for an admin route
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return adminMiddleware(request)
  }

  // Continue with other middleware or return next()
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/auth/:path*"],
}
