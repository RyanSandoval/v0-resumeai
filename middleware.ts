import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { adminMiddleware } from "./middleware/admin-middleware"

export async function middleware(request: NextRequest) {
  // Check if the request is for an admin route
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return adminMiddleware(request)
  }

  // Continue with other middleware or return next()
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
