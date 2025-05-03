import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"
import { FEATURE_LIMITS } from "@/lib/subscription-utils"

// Routes that require subscription checks
const PROTECTED_ROUTES = [
  "/api/resume/optimize",
  "/api/resume/advanced-templates",
  // Add other premium feature routes here
]

export async function subscriptionMiddleware(req: NextRequest) {
  // Check if the route requires subscription check
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => req.nextUrl.pathname.startsWith(route))

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Get the user token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token?.sub) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  // Get the feature from the route or query parameter
  const feature = req.nextUrl.pathname.includes("optimize")
    ? "resume_optimizations"
    : req.nextUrl.pathname.includes("templates")
      ? "templates"
      : req.nextUrl.searchParams.get("feature") || ""

  if (!feature) {
    return NextResponse.next()
  }

  try {
    // Get the user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: token.sub },
    })

    const plan = subscription?.plan || "free"

    // Check if the feature exists for the plan
    if (!(feature in FEATURE_LIMITS[plan])) {
      return NextResponse.json({ error: "Feature not available in your plan", upgradeUrl: "/pricing" }, { status: 403 })
    }

    // If the limit is -1, the feature is unlimited
    if (FEATURE_LIMITS[plan][feature] === -1) {
      return NextResponse.next()
    }

    // Check usage against limit
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

    const featureUsage = await prisma.featureUsage.findFirst({
      where: {
        userId: token.sub,
        feature,
        resetAt: {
          gt: firstDayOfMonth,
        },
      },
    })

    const used = featureUsage?.used || 0
    const limit = FEATURE_LIMITS[plan][feature]

    if (used >= limit) {
      return NextResponse.json(
        {
          error: "You have reached your monthly limit for this feature",
          upgradeUrl: "/pricing",
          used,
          limit,
        },
        { status: 403 },
      )
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Error checking subscription:", error)
    return NextResponse.json({ error: "An error occurred while checking your subscription" }, { status: 500 })
  }
}
