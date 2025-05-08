import { NextResponse } from "next/server"

export async function GET() {
  // Check for required environment variables
  const envVars = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "missing",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "set" : "missing",
    DATABASE_URL: process.env.DATABASE_URL ? "set" : "missing",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "set" : "missing",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "set" : "missing",
  }

  // Check if all required environment variables are set
  const missingVars = Object.entries(envVars)
    .filter(([_, value]) => value === "missing")
    .map(([key]) => key)

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    missingEnvVars: missingVars,
    nodeVersion: process.version,
  })
}
