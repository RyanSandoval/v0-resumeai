"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FaGoogle, FaApple, FaLinkedin } from "react-icons/fa"
import { FaXTwitter } from "react-icons/fa6"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function SignIn() {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({
    google: false,
    apple: false,
    twitter: false,
    linkedin: false,
  })

  const handleSignIn = async (provider: string) => {
    setIsLoading((prev) => ({ ...prev, [provider]: true }))
    await signIn(provider, { callbackUrl: "/" })
    setIsLoading((prev) => ({ ...prev, [provider]: false }))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>Sign in to save and manage your resumes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center"
            onClick={() => handleSignIn("google")}
            disabled={isLoading.google}
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
            onClick={() => handleSignIn("apple")}
            disabled={isLoading.apple}
          >
            {isLoading.apple ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FaApple className="mr-2 h-4 w-4" />}
            Continue with Apple
          </Button>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center"
            onClick={() => handleSignIn("twitter")}
            disabled={isLoading.twitter}
          >
            {isLoading.twitter ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FaXTwitter className="mr-2 h-4 w-4" />
            )}
            Continue with X
          </Button>
          <Button
            variant="outline"
            className="w-full flex items-center justify-center"
            onClick={() => handleSignIn("linkedin")}
            disabled={isLoading.linkedin}
          >
            {isLoading.linkedin ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FaLinkedin className="mr-2 h-4 w-4 text-blue-600" />
            )}
            Continue with LinkedIn
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-blue-600 hover:underline dark:text-blue-400">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-blue-600 hover:underline dark:text-blue-400">
              Privacy Policy
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
