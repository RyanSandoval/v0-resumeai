import stripe from "./stripe"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import {
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
} from "./subscription-handlers"

// This is a utility for testing webhook events locally
export async function constructWebhookEvent(eventType: string, data: any) {
  // Create a mock event object that mimics a Stripe webhook event
  return {
    id: `evt_${Math.random().toString(36).substring(2, 15)}`,
    object: "event",
    api_version: "2020-08-27",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: data,
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: `req_${Math.random().toString(36).substring(2, 15)}`,
      idempotency_key: `idempotency_${Math.random().toString(36).substring(2, 15)}`,
    },
    type: eventType,
  }
}

// Enhanced webhook handler with better logging and error handling
export async function enhancedWebhookHandler(req: Request) {
  try {
    const body = await req.text()
    const signature = headers().get("stripe-signature")!
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

    let event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log(`✅ Webhook received: ${event.type}`)
    } catch (err) {
      console.error(`❌ Webhook signature verification failed:`, err)
      return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 })
    }

    // Handle the event based on its type
    try {
      switch (event.type) {
        case "checkout.session.completed":
          await handleSubscriptionCreated(event.data.object)
          break
        case "customer.subscription.updated":
          await handleSubscriptionUpdated(event.data.object)
          break
        case "customer.subscription.deleted":
          await handleSubscriptionDeleted(event.data.object)
          break
        default:
          console.log(`Unhandled event type: ${event.type}`)
      }

      return NextResponse.json({ received: true, type: event.type })
    } catch (err) {
      console.error(`❌ Error handling webhook event ${event.type}:`, err)
      return NextResponse.json({ error: `Error handling webhook event ${event.type}` }, { status: 500 })
    }
  } catch (err) {
    console.error(`❌ Error processing webhook:`, err)
    return NextResponse.json({ error: "Error processing webhook" }, { status: 500 })
  }
}
