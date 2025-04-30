"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSession } from "@/components/auth/session-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (status !== "loading" && !session) {
      router.push("/auth/signin")
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto px-4 py-6 md:py-12">
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">Loading...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-6 md:py-12">
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-4">
            My Resumes
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mb-4">
            View and manage your saved resumes. Click on a resume to view or edit it.
          </p>
        </div>

        <div className="text-center py-12">
          <div className="mb-6">
            <p className="text-xl font-medium mb-2">No resumes saved yet</p>
            <p className="text-slate-500 dark:text-slate-400">Optimize and save your resumes to see them here</p>
          </div>
          <Button asChild>
            <Link href="/">Create New Resume</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
