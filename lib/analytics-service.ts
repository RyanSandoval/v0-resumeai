import { prisma } from "./prisma"

// Calculate Monthly Recurring Revenue (MRR)
export async function calculateMRR(): Promise<number> {
  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      status: "active",
    },
  })

  const mrrByPlan = {
    basic: 9.99,
    professional: 19.99,
    enterprise: 49.99,
  }

  return activeSubscriptions.reduce((total, sub) => {
    return total + (mrrByPlan[sub.plan as keyof typeof mrrByPlan] || 0)
  }, 0)
}

// Calculate churn rate
export async function calculateChurnRate(periodDays = 30): Promise<number> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - periodDays)

  // Count subscriptions that were active at the start of the period
  const activeAtStart = await prisma.subscription.count({
    where: {
      createdAt: {
        lt: startDate,
      },
      OR: [
        {
          status: "active",
        },
        {
          status: "canceled",
          updatedAt: {
            gt: startDate,
          },
        },
      ],
    },
  })

  // Count subscriptions that were canceled during the period
  const canceledDuringPeriod = await prisma.subscription.count({
    where: {
      status: "canceled",
      updatedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  })

  // Calculate churn rate
  return activeAtStart > 0 ? (canceledDuringPeriod / activeAtStart) * 100 : 0
}

// Get new subscriptions over time
export async function getNewSubscriptionsOverTime(
  periodDays = 30,
  interval: "day" | "week" | "month" = "day",
): Promise<{ date: string; count: number }[]> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - periodDays)

  // Get all subscription events in the period
  const events = await prisma.subscriptionEvent.findMany({
    where: {
      eventType: "subscription_created",
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  })

  // Group by interval
  const groupedEvents: Record<string, number> = {}

  events.forEach((event) => {
    let dateKey: string

    if (interval === "day") {
      dateKey = event.createdAt.toISOString().split("T")[0]
    } else if (interval === "week") {
      const date = new Date(event.createdAt)
      const firstDayOfWeek = new Date(date)
      firstDayOfWeek.setDate(date.getDate() - date.getDay())
      dateKey = firstDayOfWeek.toISOString().split("T")[0]
    } else {
      // month
      dateKey = `${event.createdAt.getFullYear()}-${(event.createdAt.getMonth() + 1).toString().padStart(2, "0")}`
    }

    groupedEvents[dateKey] = (groupedEvents[dateKey] || 0) + 1
  })

  // Fill in missing dates
  const result: { date: string; count: number }[] = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    let dateKey: string

    if (interval === "day") {
      dateKey = currentDate.toISOString().split("T")[0]
      currentDate.setDate(currentDate.getDate() + 1)
    } else if (interval === "week") {
      const firstDayOfWeek = new Date(currentDate)
      firstDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
      dateKey = firstDayOfWeek.toISOString().split("T")[0]
      currentDate.setDate(currentDate.getDate() + 7)
    } else {
      // month
      dateKey = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, "0")}`
      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    result.push({
      date: dateKey,
      count: groupedEvents[dateKey] || 0,
    })
  }

  return result
}

// Get subscription distribution by plan
export async function getSubscriptionsByPlan(): Promise<{ plan: string; count: number }[]> {
  const subscriptions = await prisma.subscription.groupBy({
    by: ["plan"],
    _count: {
      plan: true,
    },
    where: {
      status: "active",
    },
  })

  return subscriptions.map((item) => ({
    plan: item.plan,
    count: item._count.plan,
  }))
}

// Get key metrics
export async function getKeyMetrics(): Promise<{
  totalSubscribers: number
  activeSubscribers: number
  mrr: number
  churnRate: number
  averagePlanValue: number
}> {
  const totalSubscribers = await prisma.subscription.count()
  const activeSubscribers = await prisma.subscription.count({
    where: {
      status: "active",
    },
  })
  const mrr = await calculateMRR()
  const churnRate = await calculateChurnRate()

  const averagePlanValue = activeSubscribers > 0 ? mrr / activeSubscribers : 0

  return {
    totalSubscribers,
    activeSubscribers,
    mrr,
    churnRate,
    averagePlanValue,
  }
}
