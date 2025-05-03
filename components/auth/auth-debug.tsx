"use client"

import { useSession } from "next-auth/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AuthDebug() {
  const { data: session, status } = useSession()
  const [isVisible, setIsVisible] = useState(false)

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 opacity-50 hover:opacity-100"
      >
        Debug Auth
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 max-w-[90vw] shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Authentication Debug</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
          Close
        </Button>
      </CardHeader>
      <CardContent className="text-xs overflow-auto max-h-[50vh]">
        <div className="mb-2">
          <strong>Status:</strong> {status}
        </div>
        {session ? (
          <pre className="bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        ) : (
          <p>No session data available</p>
        )}
      </CardContent>
    </Card>
  )
}
