import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    api: "online",
    database: "connected",
    cache: "available",
    services: {
      optimization: "operational",
      authentication: "operational",
      storage: "operational",
    },
  })
}
