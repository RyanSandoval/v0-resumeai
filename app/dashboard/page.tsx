import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UsageTracker } from "@/components/subscription/usage-tracker"
import { FEATURE_LIMITS } from "@/lib/subscription-utils"
import { Sparkles } from "lucide-react"
import Header from "../../components/header"
import Footer from "../../components/footer"

export const metadata = {
  title: "Dashboard - AI Resume Optimizer",
  description: "Manage your resumes and track your optimization progress",
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/dashboard")
  }

  // Get the user's subscription
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  })

  const plan = subscription?.plan || "free"

  // Get feature usage
  const currentDate = new Date()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

  const resumeOptimizationsUsage = await prisma.featureUsage.findFirst({
    where: {
      userId: session.user.id,
      feature: "resume_optimizations",
      resetAt: {
        gt: firstDayOfMonth,
      },
    },
  })

  const templatesUsage = await prisma.featureUsage.findFirst({
    where: {
      userId: session.user.id,
      feature: "templates",
      resetAt: {
        gt: firstDayOfMonth,
      },
    },
  })

  // Get resume count
  const resumeCount = await prisma.resume.count({
    where: { userId: session.user.id },
  })

  // Get recent resumes
  const recentResumes = await prisma.resume.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 5,
  })

  return (
    <div style={{ padding: "20px" }}>
      <Header />
      <main className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <UsageTracker
            feature="resume_optimizations"
            used={resumeOptimizationsUsage?.used || 0}
            limit={FEATURE_LIMITS[plan].resume_optimizations}
            unlimited={FEATURE_LIMITS[plan].resume_optimizations === -1}
            title="Resume Optimizations"
            description="Monthly optimization limit"
          />

          <UsageTracker
            feature="templates"
            used={templatesUsage?.used || 0}
            limit={FEATURE_LIMITS[plan].templates}
            unlimited={FEATURE_LIMITS[plan].templates === -1}
            title="Template Access"
            description="Available resume templates"
          />

          <div className="bg-white dark:bg-slate-800 rounded-lg border shadow-sm p-6">
            <h3 className="font-medium mb-2">Your Plan</h3>
            <p className="text-2xl font-bold capitalize mb-1">{plan}</p>
            <p className="text-sm text-muted-foreground mb-4">
              {plan === "free"
                ? "Basic resume optimization"
                : plan === "basic"
                  ? "Enhanced optimization features"
                  : "Premium unlimited features"}
            </p>
            {plan === "free" && (
              <a href="/pricing" className="text-sm text-primary hover:underline inline-flex items-center">
                <Sparkles className="h-3 w-3 mr-1" />
                Upgrade for more features
              </a>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Resumes</h2>
            {recentResumes.length > 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg border shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Score</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Last Updated</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentResumes.map((resume) => (
                      <tr key={resume.id}>
                        <td className="px-4 py-3 text-sm">{resume.title}</td>
                        <td className="px-4 py-3 text-sm">{resume.score}/100</td>
                        <td className="px-4 py-3 text-sm">{new Date(resume.updatedAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <a href={`/resume/${resume.id}`} className="text-primary hover:underline">
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-lg border shadow-sm p-8 text-center">
                <p className="text-muted-foreground mb-4">You haven't created any resumes yet.</p>
                <a
                  href="/resume/new"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  Create Your First Resume
                </a>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-white dark:bg-slate-800 rounded-lg border shadow-sm p-6">
                <p className="text-sm text-muted-foreground">Total Resumes</p>
                <p className="text-3xl font-bold">{resumeCount}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg border shadow-sm p-6">
                <p className="text-sm text-muted-foreground">Optimizations This Month</p>
                <p className="text-3xl font-bold">{resumeOptimizationsUsage?.used || 0}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg border shadow-sm p-6">
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-3xl font-bold">
                  {recentResumes.length > 0
                    ? Math.round(recentResumes.reduce((acc, resume) => acc + resume.score, 0) / recentResumes.length)
                    : 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
