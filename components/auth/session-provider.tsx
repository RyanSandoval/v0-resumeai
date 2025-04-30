"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

// Create a mock session context
const SessionContext = createContext({
  data: null,
  status: "unauthenticated", // "authenticated" | "loading" | "unauthenticated"
  update: (data: any) => {},
})

// Create a hook to use the session context
export function useSession() {
  return useContext(SessionContext)
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState({
    data: null,
    status: "unauthenticated",
  })

  return (
    <SessionContext.Provider
      value={{
        ...session,
        update: (data) => setSession({ data, status: data ? "authenticated" : "unauthenticated" }),
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}
