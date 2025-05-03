"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle, Mail, Twitter, Linkedin } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function SignIn() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({
    google: false,
    twitter: false,
    linkedin: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [callbackUrl, setCallbackUrl] = useState("/")

  useEffect(() => {
    // Get the callback URL from the query parameters
    const callbackParam = searchParams.get("callbackUrl")
    if (callbackParam) {
      setCallbackUrl(callbackParam)
    }

    // Check for error in query parameters
    const errorParam = searchParams.get("error")
    if (errorParam) {
      setError("An authentication error occurred. Please try again.")
    }

    // If already signed in, redirect to callback URL
    if (status === "authenticated") {
      router.push(callbackUrl || "/")
    }
  }, [searchParams, status, router, callbackUrl])

  const handleSignIn = async (provider: string) => {
    try {
      setIsLoading((prev) => ({ ...prev, [provider]: true }))
      setError(null)

      console.log(`Signing in with ${provider}...`)

      // Use NextAuth signIn
      const result = await signIn(provider, {
        callbackUrl,
        redirect: false,
      })

      console.log("Sign in result:", result)

      if (result?.error) {
        setError(`Authentication failed: ${result.error}`)
      } else if (result?.url) {
        // Manual redirect if needed
        router.push(result.url)
      }
      // Otherwise, redirect will be handled by the useEffect when session status changes
    } catch (err) {
      console.error("Sign in error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading((prev) => ({ ...prev, [provider]: false }))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>Sign in to save and manage your resumes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            variant="outline"
            className="w-full flex items-center justify-center"
            onClick={() => handleSignIn("google")}
            disabled={Object.values(isLoading).some(Boolean)}
          >
            {isLoading.google ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4 text-red-500" />
            )}
            Continue with Google
          </Button>

          <Button
            variant="outline"
            className="w-full flex items-center justify-center"
            onClick={() => handleSignIn("twitter")}
            disabled={Object.values(isLoading).some(Boolean)}
          >
            {isLoading.twitter ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Twitter className="mr-2 h-4 w-4 text-blue-400" />
            )}
            Continue with X
          </Button>

          <Button
            variant="outline"
            className="w-full flex items-center justify-center"
            onClick={() => handleSignIn("linkedin")}
            disabled={Object.values(isLoading).some(Boolean)}
          >
            {isLoading.linkedin ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Linkedin className="mr-2 h-4 w-4 text-blue-600" />
            )}
            Continue with LinkedIn
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-blue-600 hover:underline dark:text-blue-400">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-blue-600 hover:underline dark:text-blue-400">
              Privacy Policy
            </Link>
          </p>
          <Button variant="ghost" asChild className="w-full">
            <Link href="/">Return to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
