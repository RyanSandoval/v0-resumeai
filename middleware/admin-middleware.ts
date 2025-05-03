import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

// List of admin user emails
const ADMIN_EMAILS = ["admin@example.com", "support@resumeoptimizer.com"]

export async function adminMiddleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  // Check if user is authenticated
  if (!token?.email) {
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }

  // Check if user is an admin
  const isAdmin = ADMIN_EMAILS.includes(token.email)

  if (!isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}
