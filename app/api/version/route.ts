import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    version: "1.0.0",
    buildDate: "2023-04-15",
    environment: process.env.NODE_ENV,
  })
}
