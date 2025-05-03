import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import type Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import prisma from "@/lib/prisma"
import { sendEmail } from "@/lib/email-service"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = headers().get("stripe-signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (error: any) {
    console.error(`❌ Webhook signature verification failed: ${error.message}`)
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        // Update user subscription in database
        if (session.customer && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

          const userId = session.client_reference_id
          if (!userId) {
            throw new Error("No user ID found in session")
          }

          // Get the price and product details
          const priceId = subscription.items.data[0].price.id
          const productId = subscription.items.data[0].price.product as string
          const product = await stripe.products.retrieve(productId)

          // Update user subscription in database
          await prisma.subscription.create({
            data: {
              userId: userId,
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: session.customer as string,
              stripePriceId: priceId,
              stripeProductId: productId,
              status: subscription.status,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          })

          // Get user details for email
          const user = await prisma.user.findUnique({
            where: { id: userId },
          })

          if (user && user.email) {
            // Send welcome email
            await sendEmail({
              to: user.email,
              subject: "Welcome to Resume Optimizer Premium!",
              template: "subscription-welcome",
              data: {
                name: user.name || "there",
                plan: product.name,
                nextBillingDate: new Date(subscription.current_period_end * 1000).toLocaleDateString(),
              },
            })
          }
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription

        // Get the previous subscription state
        const previousAttributes = event.data.previous_attributes as any

        // Update subscription in database
        const dbSubscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscription.id },
          include: { user: true },
        })

        if (dbSubscription) {
          // Update the subscription
          await prisma.subscription.update({
            where: { id: dbSubscription.id },
            data: {
              status: subscription.status,
              stripePriceId: subscription.items.data[0].price.id,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          })

          // Check if the price has changed (plan change)
          if (
            previousAttributes.items?.data?.[0]?.price?.id &&
            previousAttributes.items.data[0].price.id !== subscription.items.data[0].price.id
          ) {
            // Get the old and new product details
            const oldPriceId = previousAttributes.items.data[0].price.id
            const newPriceId = subscription.items.data[0].price.id

            const oldPrice = await stripe.prices.retrieve(oldPriceId)
            const newPrice = await stripe.prices.retrieve(newPriceId)

            const oldProduct = await stripe.products.retrieve(oldPrice.product as string)
            const newProduct = await stripe.products.retrieve(newPrice.product as string)

            // Send plan changed email
            if (dbSubscription.user?.email) {
              await sendEmail({
                to: dbSubscription.user.email,
                subject: "Your Resume Optimizer Plan Has Changed",
                template: "plan-changed",
                data: {
                  name: dbSubscription.user.name || "there",
                  oldPlan: oldProduct.name,
                  newPlan: newProduct.name,
                  nextBillingDate: new Date(subscription.current_period_end * 1000).toLocaleDateString(),
                },
              })
            }
          }
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice

        // Only handle subscription invoices
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)

          // Find the subscription in our database
          const dbSubscription = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId: subscription.id },
            include: { user: true },
          })

          if (dbSubscription && dbSubscription.user?.email) {
            // Get product details
            const productId = subscription.items.data[0].price.product as string
            const product = await stripe.products.retrieve(productId)

            // Send renewal email
            await sendEmail({
              to: dbSubscription.user.email,
              subject: "Your Resume Optimizer Subscription Has Renewed",
              template: "subscription-renewed",
              data: {
                name: dbSubscription.user.name || "there",
                plan: product.name,
                nextBillingDate: new Date(subscription.current_period_end * 1000).toLocaleDateString(),
              },
            })
          }
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription

        // Find and update the subscription in our database
        const dbSubscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscription.id },
          include: { user: true },
        })

        if (dbSubscription) {
          // Update the subscription status
          await prisma.subscription.update({
            where: { id: dbSubscription.id },
            data: {
              status: subscription.status,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          })

          // Get product details
          const productId = subscription.items.data[0].price.product as string
          const product = await stripe.products.retrieve(productId)

          // Send cancellation email
          if (dbSubscription.user?.email) {
            await sendEmail({
              to: dbSubscription.user.email,
              subject: "Your Resume Optimizer Subscription Has Been Canceled",
              template: "subscription-canceled",
              data: {
                name: dbSubscription.user.name || "there",
                plan: product.name,
                endDate: new Date(subscription.current_period_end * 1000).toLocaleDateString(),
              },
            })
          }
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`❌ Webhook handler failed: ${error}`)
    return new NextResponse(`Webhook Error: ${error}`, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
