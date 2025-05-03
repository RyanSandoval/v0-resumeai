"use client"

import type React from "react"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}

// Re-export useSession from next-auth/react for convenience
export { useSession } from "next-auth/react"
