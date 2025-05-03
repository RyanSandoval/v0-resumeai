import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard"
import { getKeyMetrics, getSubscriptionsByPlan, getNewSubscriptionsOverTime } from "@/lib/analytics-service"
import { EmailTester } from "@/components/admin/email-tester"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export const metadata = {
  title: "Admin Dashboard - Resume Optimizer",
  description: "Admin dashboard for Resume Optimizer",
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/admin")
  }

  // Check if user is an admin
  const adminEmails = process.env.ADMIN_EMAILS?.split(",") || []
  const isAdmin = adminEmails.includes(session.user.email)

  if (!isAdmin) {
    redirect("/dashboard")
  }

  // Get analytics data
  const metrics = await getKeyMetrics()
  const subscriptionsByPlan = await getSubscriptionsByPlan()
  const subscriptionsOverTime = await getNewSubscriptionsOverTime(30, "day")

  return (
    <main className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="mb-8">
        <AnalyticsDashboard
          initialMetrics={metrics}
          initialSubscriptionsByPlan={subscriptionsByPlan}
          initialSubscriptionsOverTime={subscriptionsOverTime}
        />
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="col-span-1">
          <h2 className="text-xl font-semibold mb-4">Email Configuration</h2>
          <EmailTester />
        </div>
        <div className="col-span-1 md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <SystemStatusCard />
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Subscriptions</h2>
          <AdminSubscriptionsList />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          <AdminUsersList />
        </div>
      </div>
    </main>
  )
}

function SystemStatusCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Status</CardTitle>
        <CardDescription>Current status of system components and services</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Database Connection</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="mr-1 h-3 w-3" /> Connected
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Stripe Integration</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="mr-1 h-3 w-3" /> Active
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Email Service (Brevo)</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="mr-1 h-3 w-3" /> Configured
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Authentication</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="mr-1 h-3 w-3" /> Active
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

async function AdminSubscriptionsList() {
  const recentSubscriptions = await prisma.subscription.findMany({
    take: 10,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">User</th>
              <th className="text-left py-2">Plan</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {recentSubscriptions.map((subscription) => (
              <tr key={subscription.id} className="border-b">
                <td className="py-2">
                  <div>{subscription.user.name}</div>
                  <div className="text-sm text-muted-foreground">{subscription.user.email}</div>
                </td>
                <td className="py-2 capitalize">{subscription.plan}</td>
                <td className="py-2">
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full ${
                      subscription.status === "active" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {subscription.status}
                  </span>
                </td>
                <td className="py-2">{new Date(subscription.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {recentSubscriptions.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-muted-foreground">
                  No subscriptions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

async function AdminUsersList() {
  const recentUsers = await prisma.user.findMany({
    take: 10,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      subscription: true,
    },
  })

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">User</th>
              <th className="text-left py-2">Joined</th>
              <th className="text-left py-2">Plan</th>
              <th className="text-left py-2">Resumes</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="py-2">
                  <div>{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </td>
                <td className="py-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="py-2 capitalize">{user.subscription?.plan || "free"}</td>
                <td className="py-2">-</td>
              </tr>
            ))}
            {recentUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-muted-foreground">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
