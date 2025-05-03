import { prisma } from "./prisma"
import { sendEmail } from "./email-service"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

// Map Stripe price IDs to plan names
const PLAN_MAP: Record<string, string> = {
  price_basic_monthly: "basic",
  price_professional_monthly: "professional",
  price_enterprise_monthly: "enterprise",
}

// Handle subscription created event
export async function handleSubscriptionCreated(session: any) {
  try {
    console.log("Processing subscription creation...")

    // Retrieve the subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

    // Get the plan from the subscription
    const planId = subscription.items.data[0].price.id
    const plan = PLAN_MAP[planId] || "basic"

    // Get user ID from metadata
    const userId = session.metadata.userId || subscription.metadata.userId

    if (!userId) {
      throw new Error("No userId found in subscription metadata")
    }

    // Create or update subscription record in the database
    const dbSubscription = await prisma.subscription.upsert({
      where: { userId },
      update: {
        stripeSubscriptionId: subscription.id,
        plan,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
      create: {
        userId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscription.id,
        plan,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    })

    // Log analytics event
    await logSubscriptionEvent("subscription_created", {
      userId,
      plan,
      subscriptionId: subscription.id,
      amount: subscription.items.data[0].price.unit_amount! / 100,
    })

    // Send welcome email
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: `Welcome to Resume Optimizer ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan!`,
        template: "subscription-welcome",
        data: {
          name: user.name || "there",
          plan: plan.charAt(0).toUpperCase() + plan.slice(1),
          nextBillingDate: new Date(subscription.current_period_end * 1000).toLocaleDateString(),
        },
      })
    }

    console.log(`✅ Subscription created successfully for user ${userId}`)
    return dbSubscription
  } catch (error) {
    console.error("❌ Error handling subscription creation:", error)
    throw error
  }
}

// Handle subscription updated event
export async function handleSubscriptionUpdated(subscription: any) {
  try {
    console.log("Processing subscription update...")

    // Get the user ID from the subscription metadata
    const userId = subscription.metadata.userId

    if (!userId) {
      throw new Error("No userId found in subscription metadata")
    }

    // Get the plan from the subscription
    const planId = subscription.items.data[0].price.id
    const plan = PLAN_MAP[planId] || "basic"

    // Get the previous subscription data
    const previousSubscription = await prisma.subscription.findUnique({
      where: { userId },
    })

    // Update the subscription in the database
    const updatedSubscription = await prisma.subscription.update({
      where: { userId },
      data: {
        plan,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    })

    // Check if the plan changed
    if (previousSubscription && previousSubscription.plan !== plan) {
      // Log plan change analytics
      await logSubscriptionEvent("plan_changed", {
        userId,
        oldPlan: previousSubscription.plan,
        newPlan: plan,
        subscriptionId: subscription.id,
        amount: subscription.items.data[0].price.unit_amount! / 100,
      })

      // Send plan change email
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: `Your Resume Optimizer Plan Has Been Updated`,
          template: "plan-changed",
          data: {
            name: user.name || "there",
            oldPlan: previousSubscription.plan.charAt(0).toUpperCase() + previousSubscription.plan.slice(1),
            newPlan: plan.charAt(0).toUpperCase() + plan.slice(1),
            nextBillingDate: new Date(subscription.current_period_end * 1000).toLocaleDateString(),
          },
        })
      }
    }

    // Check if the subscription was renewed
    if (
      previousSubscription &&
      new Date(previousSubscription.currentPeriodEnd).getTime() <
        new Date(subscription.current_period_start * 1000).getTime()
    ) {
      // Log renewal analytics
      await logSubscriptionEvent("subscription_renewed", {
        userId,
        plan,
        subscriptionId: subscription.id,
        amount: subscription.items.data[0].price.unit_amount! / 100,
      })

      // Send renewal email
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: `Your Resume Optimizer Subscription Has Been Renewed`,
          template: "subscription-renewed",
          data: {
            name: user.name || "there",
            plan: plan.charAt(0).toUpperCase() + plan.slice(1),
            nextBillingDate: new Date(subscription.current_period_end * 1000).toLocaleDateString(),
          },
        })
      }
    }

    console.log(`✅ Subscription updated successfully for user ${userId}`)
    return updatedSubscription
  } catch (error) {
    console.error("❌ Error handling subscription update:", error)
    throw error
  }
}

// Handle subscription deleted event
export async function handleSubscriptionDeleted(subscription: any) {
  try {
    console.log("Processing subscription deletion...")

    // Get the user ID from the subscription metadata
    const userId = subscription.metadata.userId

    if (!userId) {
      throw new Error("No userId found in subscription metadata")
    }

    // Update the subscription status in the database
    const updatedSubscription = await prisma.subscription.update({
      where: { userId },
      data: {
        status: "canceled",
      },
    })

    // Log cancellation analytics
    await logSubscriptionEvent("subscription_canceled", {
      userId,
      plan: updatedSubscription.plan,
      subscriptionId: subscription.id,
    })

    // Send cancellation email
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: `Your Resume Optimizer Subscription Has Been Canceled`,
        template: "subscription-canceled",
        data: {
          name: user.name || "there",
          plan: updatedSubscription.plan.charAt(0).toUpperCase() + updatedSubscription.plan.slice(1),
          endDate: new Date(subscription.current_period_end * 1000).toLocaleDateString(),
        },
      })
    }

    console.log(`✅ Subscription canceled successfully for user ${userId}`)
    return updatedSubscription
  } catch (error) {
    console.error("❌ Error handling subscription deletion:", error)
    throw error
  }
}

// Log subscription events for analytics
async function logSubscriptionEvent(eventType: string, data: any) {
  try {
    await prisma.subscriptionEvent.create({
      data: {
        eventType,
        userId: data.userId,
        plan: data.plan,
        amount: data.amount,
        metadata: data,
      },
    })
  } catch (error) {
    console.error(`Error logging subscription event ${eventType}:`, error)
  }
}
