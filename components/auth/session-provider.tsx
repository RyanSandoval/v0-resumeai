import type React from "react"
;('"use client')

import { SessionProvider as NextAuthSessionProvider, useSession as useNextAuthSession } from "next-auth/react"

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}

export function useSession() {
  return useNextAuthSession()
}
