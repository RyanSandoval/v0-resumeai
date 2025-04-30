"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FaGoogle } from "react-icons/fa"
import { FaXTwitter } from "react-icons/fa6"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function SignIn() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({
    google: false,
    twitter: false,
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
      switch (errorParam) {
        case "OAuthSignin":
          setError("An error occurred while trying to sign in with the provider.")
          break
        case "OAuthCallback":
          setError("An error occurred during the authentication callback.")
          break
        case "OAuthCreateAccount":
          setError("There was a problem creating your account.")
          break
        case "EmailCreateAccount":
          setError("There was a problem creating your account.")
          break
        case "Callback":
          setError("There was a problem with the authentication callback.")
          break
        case "OAuthAccountNotLinked":
          setError("This email is already associated with another account.")
          break
        case "EmailSignin":
          setError("The email could not be sent or is invalid.")
          break
        case "CredentialsSignin":
          setError("The credentials you provided are invalid.")
          break
        case "SessionRequired":
          setError("You must be signed in to access this page.")
          break
        default:
          setError("An unknown error occurred during authentication.")
      }
    }
  }, [searchParams])

  const handleSignIn = async (provider: string) => {
    try {
      setIsLoading((prev) => ({ ...prev, [provider]: true }))
      setError(null)

      const result = await signIn(provider, {
        callbackUrl,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Sign in error:", err)
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
            disabled={isLoading.google || isLoading.twitter}
          >
            {isLoading.google ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FaGoogle className="mr-2 h-4 w-4 text-red-500" />
            )}
            Continue with Google
          </Button>

          <Button
            variant="outline"
            className="w-full flex items-center justify-center"
            onClick={() => handleSignIn("twitter")}
            disabled={isLoading.google || isLoading.twitter}
          >
            {isLoading.twitter ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FaXTwitter className="mr-2 h-4 w-4" />
            )}
            Continue with X
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
