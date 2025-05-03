"use client"

import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"

interface UsageTrackerProps {
  feature: string
  used: number
  limit: number
  unlimited?: boolean
  title: string
  description: string
}

export function UsageTracker({ feature, used, limit, unlimited = false, title, description }: UsageTrackerProps) {
  const router = useRouter()

  // Calculate percentage, capped at 100%
  const percentage = unlimited ? 10 : Math.min(Math.round((used / limit) * 100), 100)

  // Determine if the user is approaching their limit (80% or more)
  const approachingLimit = !unlimited && used >= limit * 0.8

  // Determine if the user has reached their limit
  const reachedLimit = !unlimited && used >= limit

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {used} / {unlimited ? "∞" : limit} used
            </span>
            {approachingLimit && !reachedLimit && (
              <span className="text-xs text-amber-500 font-medium">Approaching limit</span>
            )}
            {reachedLimit && <span className="text-xs text-red-500 font-medium">Limit reached</span>}
          </div>

          <Progress
            value={percentage}
            className={`h-2 ${reachedLimit ? "bg-red-100" : approachingLimit ? "bg-amber-100" : ""}`}
          />

          {reachedLimit && (
            <Button onClick={() => router.push("/pricing")} className="w-full mt-2" size="sm">
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade to continue
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
