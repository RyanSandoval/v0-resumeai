import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    user: {
      name: "John Doe",
      email: "john@example.com",
    },
    stats: {
      resumes: 3,
      optimizations: 12,
      applications: 8,
    },
  })
}
