import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()

  // This is a mock contact form endpoint
  return NextResponse.json({
    success: true,
    message: "Your message has been sent. We will get back to you soon!",
  })
}
