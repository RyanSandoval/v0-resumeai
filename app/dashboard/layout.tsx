import type React from "react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, FileText, Settings, LogOut, User, Briefcase, FileUp } from "lucide-react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/dashboard")
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden md:block">
        <div className="h-full flex flex-col">
          <div className="p-6">
            <h2 className="text-xl font-bold">Resume Optimizer</h2>
          </div>
          <nav className="flex-1 px-4 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/resume/new"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <FileText className="h-4 w-4" />
              New Resume
            </Link>
            <Link
              href="/dashboard/jobs"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <Briefcase className="h-4 w-4" />
              Job Tracker
            </Link>
            <Link
              href="/dashboard/baseline"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <FileUp className="h-4 w-4" />
              Baseline Resume
            </Link>
            <Link
              href="/dashboard/account"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <User className="h-4 w-4" />
              Account
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </nav>
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <Link
              href="/api/auth/signout"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Link>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
