import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    user: {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      plan: "premium",
      joinDate: "2023-01-01",
    },
  })
}
