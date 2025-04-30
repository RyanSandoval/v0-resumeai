import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Simplified middleware without authentication
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/resume/:path*", "/auth/signin"],
}
