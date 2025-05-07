import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    settings: {
      notifications: {
        email: true,
        browser: true,
        marketing: false,
      },
      privacy: {
        shareData: false,
        allowAnalytics: true,
      },
      display: {
        theme: "light",
        fontSize: "medium",
      },
    },
  })
}
