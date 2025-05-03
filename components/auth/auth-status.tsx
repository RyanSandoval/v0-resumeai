"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export function AuthStatus() {
  const { data: session, status } = useSession()
  const [healthCheck, setHealthCheck] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkHealth = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/health")
      const data = await res.json()
      setHealthCheck(data)
    } catch (error) {
      console.error("Health check failed:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  return (
    <div className="space-y-4">
      <Alert variant={status === "authenticated" ? "default" : "destructive"}>
        <AlertTitle>Authentication Status: {status}</AlertTitle>
        <AlertDescription>
          {status === "authenticated" ? (
            <p>You are signed in as {session?.user?.email || "Unknown User"}</p>
          ) : status === "loading" ? (
            <p>Checking authentication status...</p>
          ) : (
            <p>You are not signed in. Please sign in to access all features.</p>
          )}
        </AlertDescription>
      </Alert>

      {healthCheck && (
        <div className="text-sm">
          <h3 className="font-medium mb-2">System Status:</h3>
          <ul className="space-y-1">
            <li>Environment: {healthCheck.environment}</li>
            <li>NEXTAUTH_URL: {healthCheck.auth.nextAuthUrl}</li>
            <li>NEXTAUTH_SECRET: {healthCheck.auth.nextAuthSecret}</li>
            <li>
              Google OAuth:{" "}
              {healthCheck.auth.googleClientId && healthCheck.auth.googleClientSecret ? "Configured" : "Not configured"}
            </li>
            <li>
              Twitter OAuth:{" "}
              {healthCheck.auth.twitterClientId && healthCheck.auth.twitterClientSecret
                ? "Configured"
                : "Not configured"}
            </li>
            <li>
              LinkedIn OAuth:{" "}
              {healthCheck.auth.linkedinClientId && healthCheck.auth.linkedinClientSecret
                ? "Configured"
                : "Not configured"}
            </li>
          </ul>
          <Button variant="outline" size="sm" onClick={checkHealth} disabled={loading} className="mt-2">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh Status
          </Button>
        </div>
      )}
    </div>
  )
}
