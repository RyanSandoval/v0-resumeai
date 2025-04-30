"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [errorDescription, setErrorDescription] = useState<string>("")

  useEffect(() => {
    const errorParam = searchParams.get("error")
    setError(errorParam)

    // Set a more user-friendly error description based on the error code
    switch (errorParam) {
      case "Configuration":
        setErrorDescription("There is a problem with the server configuration.")
        break
      case "AccessDenied":
        setErrorDescription("You do not have permission to sign in.")
        break
      case "Verification":
        setErrorDescription("The verification link may have been used or is invalid.")
        break
      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
      case "EmailCreateAccount":
      case "Callback":
        setErrorDescription("There was a problem with the authentication provider.")
        break
      case "OAuthAccountNotLinked":
        setErrorDescription("This email is already associated with another account.")
        break
      case "EmailSignin":
        setErrorDescription("The email could not be sent or is invalid.")
        break
      case "CredentialsSignin":
        setErrorDescription("The credentials you provided are invalid.")
        break
      case "SessionRequired":
        setErrorDescription("You must be signed in to access this page.")
        break
      default:
        setErrorDescription("An unknown error occurred during authentication.")
    }
  }, [searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl">Authentication Error</CardTitle>
          <CardDescription>{error ? `Error: ${error}` : "An error occurred during authentication"}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">{errorDescription}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Please try again or contact support if the problem persists.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button asChild variant="outline">
            <Link href="/auth/signin">Try Again</Link>
          </Button>
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
