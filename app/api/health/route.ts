import { NextResponse } from "next/server"

export async function GET() {
  // Check environment variables
  const envVars = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "✓" : "✗",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "✓" : "✗",
    DATABASE_URL: process.env.DATABASE_URL ? "✓" : "✗",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "✓" : "✗",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "✓" : "✗",
  }

  // Check Node.js version
  const nodeVersion = process.version

  // Check runtime environment
  const environment = process.env.NODE_ENV || "unknown"

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment,
    nodeVersion,
    envVars,
  })
}
