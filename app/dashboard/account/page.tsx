import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AccountBilling } from "@/components/subscription/account-billing"

export const metadata = {
  title: "Account - AI Resume Optimizer",
  description: "Manage your account and subscription",
}

export default async function AccountPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/dashboard/account")
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  })

  return (
    <main className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <AccountBilling subscription={subscription} />
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{session.user.name || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{session.user.email}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Usage Statistics</h2>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Resume Optimizations This Month</p>
                  <p className="text-2xl font-bold">
                    3 / {subscription?.plan === "professional" ? "∞" : subscription?.plan === "basic" ? "10" : "2"}
                  </p>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width:
                        subscription?.plan === "professional"
                          ? "10%"
                          : `${(3 / (subscription?.plan === "basic" ? 10 : 2)) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
