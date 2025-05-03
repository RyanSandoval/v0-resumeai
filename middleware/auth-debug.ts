import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  console.log("Auth Debug Middleware - Request path:", request.nextUrl.pathname)

  // Only log auth-related requests
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    console.log("Auth request headers:", Object.fromEntries(request.headers))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/auth/:path*", "/auth/:path*"],
}
