import { prisma } from "./prisma"

// Define feature limits for each plan
export const FEATURE_LIMITS: Record<string, Record<string, number>> = {
  free: {
    resume_optimizations: 2,
    templates: 3,
  },
  basic: {
    resume_optimizations: 10,
    templates: -1, // -1 means unlimited
  },
  professional: {
    resume_optimizations: -1, // -1 means unlimited
    templates: -1,
  },
}

// Check if a user has access to a feature
export async function hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  const plan = subscription?.plan || "free"

  // Check if the feature exists for the plan
  if (!(feature in FEATURE_LIMITS[plan])) {
    return false
  }

  // If the limit is -1, the feature is unlimited
  if (FEATURE_LIMITS[plan][feature] === -1) {
    return true
  }

  // Check usage against limit
  const usage = await getFeatureUsage(userId, feature)
  return usage < FEATURE_LIMITS[plan][feature]
}

// Check and increment feature usage
export async function useFeature(userId: string, feature: string): Promise<{ allowed: boolean; remaining: number }> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  const plan = subscription?.plan || "free"

  // Check if the feature exists for the plan
  if (!(feature in FEATURE_LIMITS[plan])) {
    return { allowed: false, remaining: 0 }
  }

  const limit = FEATURE_LIMITS[plan][feature]

  // If the limit is -1, the feature is unlimited
  if (limit === -1) {
    // Still track usage for analytics
    await incrementFeatureUsage(userId, feature)
    return { allowed: true, remaining: -1 }
  }

  // Check usage against limit
  const usage = await getFeatureUsage(userId, feature)
  const remaining = limit - usage

  if (remaining <= 0) {
    return { allowed: false, remaining: 0 }
  }

  // Increment usage
  await incrementFeatureUsage(userId, feature)

  return { allowed: true, remaining: remaining - 1 }
}

// Get feature usage information
export async function getFeatureUsageInfo(
  userId: string,
  feature: string,
): Promise<{ used: number; limit: number; unlimited: boolean }> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  const plan = subscription?.plan || "free"

  // Check if the feature exists for the plan
  if (!(feature in FEATURE_LIMITS[plan])) {
    return { used: 0, limit: 0, unlimited: false }
  }

  const limit = FEATURE_LIMITS[plan][feature]
  const used = await getFeatureUsage(userId, feature)

  return {
    used,
    limit,
    unlimited: limit === -1,
  }
}

// Get feature usage
async function getFeatureUsage(userId: string, feature: string): Promise<number> {
  // Check if there's an active usage record for this month
  const currentDate = new Date()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

  const featureUsage = await prisma.featureUsage.findFirst({
    where: {
      userId,
      feature,
      resetAt: {
        gt: firstDayOfMonth,
      },
    },
  })

  return featureUsage?.used || 0
}

// Increment feature usage
async function incrementFeatureUsage(userId: string, feature: string): Promise<void> {
  // Calculate reset date (first day of next month)
  const currentDate = new Date()
  const resetAt = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)

  // Get subscription to determine limit
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  const plan = subscription?.plan || "free"

  // Define limits based on plan
  const limit = FEATURE_LIMITS[plan][feature] || 0

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
