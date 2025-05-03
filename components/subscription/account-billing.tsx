"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/utils"

type SubscriptionProps = {
  subscription: {
    id: string
    plan: string
    status: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
  } | null
}

export function AccountBilling({ subscription }: SubscriptionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleManageSubscription = async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/stripe/create-portal", {
        method: "POST",
      })

      const { url, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      // Redirect to Stripe Customer Portal
      window.location.href = url
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPlanDetails = () => {
    switch (subscription?.plan) {
      case "basic":
        return {
          name: "Basic",
          price: "$9.99/month",
          features: ["10 resume optimizations per month", "All templates", "Advanced optimization", "Email support"],
        }
      case "professional":
        return {
          name: "Professional",
          price: "$19.99/month",
          features: ["Unlimited optimizations", "Premium templates", "Priority support", "LinkedIn integration"],
        }
      default:
        return {
          name: "Free",
          price: "$0/month",
          features: ["2 resume optimizations per month", "Basic templates", "Standard optimization"],
        }
    }
  }

  const planDetails = getPlanDetails()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>Manage your subscription and billing information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Current Plan</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">{planDetails.name}</p>
                <p className="text-muted-foreground">{planDetails.price}</p>
              </div>
              {subscription?.status === "active" && (
                <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Active</div>
              )}
              {subscription?.status === "canceled" && (
                <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">Canceled</div>
              )}
            </div>
          </div>

          {subscription && (
            <div>
              <h3 className="font-medium">Billing Period</h3>
              <p>
                {subscription.cancelAtPeriodEnd
                  ? `Your subscription will end on ${formatDate(new Date(subscription.currentPeriodEnd))}`
                  : `Your next billing date is ${formatDate(new Date(subscription.currentPeriodEnd))}`}
              </p>
            </div>
          )}

          <div>
            <h3 className="font-medium">Plan Features</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {planDetails.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {subscription?.status === "active" ? (
          <Button onClick={handleManageSubscription} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Manage Subscription"
            )}
          </Button>
        ) : (
          <Button onClick={() => router.push("/pricing")}>Upgrade Plan</Button>
        )}
      </CardFooter>
    </Card>
  )
}
