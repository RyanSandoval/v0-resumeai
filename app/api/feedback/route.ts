import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()

  // This is a mock feedback endpoint
  return NextResponse.json({
    success: true,
    feedbackId: Math.floor(Math.random() * 1000),
    message: "Thank you for your feedback!",
  })
}
