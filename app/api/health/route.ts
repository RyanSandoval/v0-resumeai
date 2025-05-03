import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    auth: {
      nextAuthUrl: process.env.NEXTAUTH_URL ? "Set" : "Not set",
      nextAuthSecret: process.env.NEXTAUTH_SECRET ? "Set" : "Not set",
      googleClientId: process.env.GOOGLE_CLIENT_ID ? "Set" : "Not set",
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? "Set" : "Not set",
      twitterClientId: process.env.TWITTER_CLIENT_ID ? "Set" : "Not set",
      twitterClientSecret: process.env.TWITTER_CLIENT_SECRET ? "Set" : "Not set",
      linkedinClientId: process.env.LINKEDIN_CLIENT_ID ? "Set" : "Not set",
      linkedinClientSecret: process.env.LINKEDIN_CLIENT_SECRET ? "Set" : "Not set",
    },
  })
}
