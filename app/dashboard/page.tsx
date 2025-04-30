import { redirect } from "next/navigation"
import { SavedResumesList } from "@/components/dashboard/saved-resumes-list"
import * as db from "@/lib/db"

export default async function DashboardPage() {
  // Import and use getServerSession dynamically
  const { getServerSession } = await import("next-auth/next")
  const { authOptions } = await import("@/app/api/auth/[...nextauth]/route")

  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  try {
    // Initialize database if needed
    await db.initDatabase()

    // Get user resumes
    const resumes = await db.getResumesByUserId(session.user.id)

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

          <SavedResumesList resumes={resumes} />
        </div>
      </main>
    )
  } catch (error) {
    console.error("Dashboard error:", error)

    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto px-4 py-6 md:py-12">
          <div className="mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-4">
              My Resumes
            </h1>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 text-red-700 dark:text-red-400">
            There was an error connecting to the database. Please try again later.
          </div>
        </div>
      </main>
    )
  }
}
