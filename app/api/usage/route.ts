import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    usage: {
      optimizationsUsed: 12,
      optimizationsRemaining: 38,
      resumeCount: 3,
      lastActivity: "2023-04-10T15:30:00Z",
    },
  })
}
