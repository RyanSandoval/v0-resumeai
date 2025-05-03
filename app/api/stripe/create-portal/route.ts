import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import stripe from "@/lib/stripe"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in to access the customer portal" }, { status: 401 })
    }

    // Get the user's subscription from the database
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json({ error: "No subscription found for this user" }, { status: 404 })
    }

    // Create a Stripe customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard/account`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error("Error creating customer portal session:", error)
    return NextResponse.json({ error: "An error occurred while creating the customer portal session" }, { status: 500 })
  }
}
