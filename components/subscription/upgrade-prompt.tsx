"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface UpgradePromptProps {
  feature: string
  used: number
  limit: number
  title?: string
  description?: string
  children?: React.ReactNode
}

export function UpgradePrompt({
  feature,
  used,
  limit,
  title = "Usage Limit Reached",
  description = "You've reached your monthly limit for this feature.",
  children,
}: UpgradePromptProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleUpgrade = () => {
    setIsLoading(true)
    router.push("/pricing")
  }

  const featureNames: Record<string, string> = {
    resume_optimizations: "resume optimizations",
    templates: "premium templates",
  }

  const featureName = featureNames[feature] || feature

  return (
    <Dialog>
      <DialogTrigger asChild>{children || <Button variant="outline">View Usage</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-2xl font-bold">
                  {used}/{limit}
                </p>
                <p className="text-sm text-muted-foreground">You've used all your {featureName} for this month</p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 space-y-4">
            <h4 className="text-sm font-medium">Upgrade to get:</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <Sparkles className="mr-2 h-4 w-4 text-primary" />
                <span>More monthly {featureName}</span>
              </li>
              <li className="flex items-start">
                <Sparkles className="mr-2 h-4 w-4 text-primary" />
                <span>Access to premium features</span>
              </li>
              <li className="flex items-start">
                <Sparkles className="mr-2 h-4 w-4 text-primary" />
                <span>Priority support</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Maybe Later
          </Button>
          <Button onClick={handleUpgrade} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Upgrade Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
