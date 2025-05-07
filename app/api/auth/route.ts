import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()

  // This is a mock authentication endpoint
  if (body.email === "user@example.com" && body.password === "password") {
    return NextResponse.json({
      success: true,
      user: {
        id: 1,
        name: "Test User",
        email: "user@example.com",
      },
    })
  }

  return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
}
