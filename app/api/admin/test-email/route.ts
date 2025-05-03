import { type NextRequest, NextResponse } from "next/server"
import { sendTestEmail } from "@/lib/test-email"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is an admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || []
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const success = await sendTestEmail(email)

    if (success) {
      return NextResponse.json({ message: "Test email sent successfully" })
    } else {
      return NextResponse.json({ error: "Failed to send test email" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in test email API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
