"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getStripe } from "@/lib/stripe-client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

const pricingPlans = [
  {
    name: "Free",
    description: "Basic resume optimization for occasional job seekers",
    price: 0,
    features: ["2 resume optimizations per month", "Basic templates", "Standard optimization", "Email support"],
    priceId: "",
    cta: "Current Plan",
    disabled: true,
  },
  {
    name: "Basic",
    description: "Enhanced optimization for active job seekers",
    price: 9.99,
    features: [
      "10 resume optimizations per month",
      "All templates",
      "Advanced optimization",
      "Email support",
      "Resume history",
    ],
    priceId: "price_basic_monthly",
    cta: "Subscribe",
    popular: true,
  },
  {
    name: "Professional",
    description: "Unlimited optimization for serious job hunters",
    price: 19.99,
    features: [
      "Unlimited optimizations",
      "Premium templates",
      "Priority support",
      "LinkedIn integration",
      "Resume tracking",
      "Cover letter assistance",
    ],
    priceId: "price_professional_monthly",
    cta: "Subscribe",
  },
]

export function PricingPlans() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const { toast } = useToast()
  const { data: session } = useSession()
  const router = useRouter()

  const handleSubscribe = async (priceId: string) => {
    if (!session?.user) {
      router.push("/auth/signin?callbackUrl=/pricing")
      return
    }

    try {
      setIsLoading(priceId)

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      })

      const { sessionId, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      // Redirect to Stripe Checkout
      const stripe = await getStripe()
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId })

      if (stripeError) {
        throw new Error(stripeError.message)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {pricingPlans.map((plan) => (
        <Card key={plan.name} className={`flex flex-col ${plan.popular ? "border-primary shadow-lg" : ""}`}>
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="mb-4">
              <span className="text-3xl font-bold">${plan.price}</span>
              {plan.price > 0 && <span className="text-muted-foreground">/month</span>}
            </div>
            <ul className="space-y-2 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => plan.priceId && handleSubscribe(plan.priceId)}
              disabled={plan.disabled || isLoading === plan.priceId}
              variant={plan.popular ? "default" : "outline"}
            >
              {isLoading === plan.priceId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                plan.cta
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
