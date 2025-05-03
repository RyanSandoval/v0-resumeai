"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { FEATURE_LIMITS } from "@/lib/subscription-utils"

export async function trackFeatureUsage(feature: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Authentication required",
      }
    }

    // Get the user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    const plan = subscription?.plan || "free"

    // Check if the feature exists for the plan
    if (!(feature in FEATURE_LIMITS[plan])) {
      return {
        success: false,
        error: "Feature not available in your plan",
        requiresUpgrade: true,
      }
    }

    const limit = FEATURE_LIMITS[plan][feature]

    // If the limit is -1, the feature is unlimited
    if (limit === -1) {
      // Still track usage for analytics
      await incrementFeatureUsage(session.user.id, feature, limit)
      return {
        success: true,
        unlimited: true,
        used: 0,
        limit: -1,
        remaining: -1,
      }
    }

    // Check usage against limit
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)

    const featureUsage = await prisma.featureUsage.findFirst({
      where: {
        userId: session.user.id,
        feature,
        resetAt: {
          gt: firstDayOfMonth,
        },
      },
    })

    const used = featureUsage?.used || 0

    if (used >= limit) {
      return {
        success: false,
        error: "You have reached your monthly limit for this feature",
        requiresUpgrade: true,
        used,
        limit,
        remaining: 0,
      }
    }

    // Increment usage
    await incrementFeatureUsage(session.user.id, feature, limit, nextMonth)

    return {
      success: true,
      used: used + 1,
      limit,
      remaining: limit - (used + 1),
    }
  } catch (error) {
    console.error("Error tracking feature usage:", error)
    return {
      success: false,
      error: "An error occurred while tracking feature usage",
    }
  }
}

// Export the incrementFeatureUsage function as requested in the error
export async function incrementFeatureUsage(
  userId: string,
  feature: string,
  limit: number,
  resetAt: Date = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
) {
  // Update or create feature usage record
  await prisma.featureUsage.upsert({
    where: {
      userId_feature: {
        userId,
        feature,
      },
    },
    update: {
      used: {
        increment: 1,
      },
      usageLimit: limit,
      updatedAt: new Date(),
    },
    create: {
      userId,
      feature,
      used: 1,
      usageLimit: limit,
      resetAt,
    },
  })
}

// Add the checkFeatureUsage function as requested in the error
export async function checkFeatureUsage(feature: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Authentication required",
      }
    }

    // Get the user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    const plan = subscription?.plan || "free"

    // Check if the feature exists for the plan
    if (!(feature in FEATURE_LIMITS[plan])) {
      return {
        success: false,
        error: "Feature not available in your plan",
        requiresUpgrade: true,
      }
    }

    const limit = FEATURE_LIMITS[plan][feature]

    // If the limit is -1, the feature is unlimited
    if (limit === -1) {
      return {
        success: true,
        unlimited: true,
        used: 0,
        limit: -1,
        remaining: -1,
      }
    }

    // Check usage against limit
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

    const featureUsage = await prisma.featureUsage.findFirst({
      where: {
        userId: session.user.id,
        feature,
        resetAt: {
          gt: firstDayOfMonth,
        },
      },
    })

    const used = featureUsage?.used || 0
    const remaining = limit - used

    return {
      success: true,
      used,
      limit,
      remaining,
      canUse: remaining > 0,
    }
  } catch (error) {
    console.error("Error checking feature usage:", error)
    return {
      success: false,
      error: "An error occurred while checking feature usage",
    }
  }
}
