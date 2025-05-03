import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getKeyMetrics, getSubscriptionsByPlan, getNewSubscriptionsOverTime } from "@/lib/analytics-service"

// List of admin user emails
const ADMIN_EMAILS = ["admin@example.com", "support@resumeoptimizer.com"]

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is an admin
    const isAdmin = ADMIN_EMAILS.includes(session.user.email)

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get query parameters
    const url = new URL(req.url)
    const period = url.searchParams.get("period") || "30"
    const interval = url.searchParams.get("interval") || "day"

    // Get analytics data
    const metrics = await getKeyMetrics()
    const subscriptionsByPlan = await getSubscriptionsByPlan()
    const subscriptionsOverTime = await getNewSubscriptionsOverTime(
      Number.parseInt(period),
      interval as "day" | "week" | "month",
    )

    return NextResponse.json({
      metrics,
      subscriptionsByPlan,
      subscriptionsOverTime,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "An error occurred while fetching analytics" }, { status: 500 })
  }
}
