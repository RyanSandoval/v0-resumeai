import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthButton } from "@/components/auth/auth-button"
import { SessionProvider } from "@/components/auth/session-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Resume Optimizer",
  description:
    "Automatically tailor your resume to match job descriptions and stand out to recruiters and ATS systems.",
    generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Import and use getServerSession dynamically
  const { getServerSession } = await import("next-auth/next")

  // Create a simple session object to avoid build-time errors
  let session = null

  try {
    const { authOptions } = await import("@/app/api/auth/[...nextauth]/route")
    session = await getServerSession(authOptions)
  } catch (error) {
    console.error("Error getting session:", error)
    // Continue with null session
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <a href="/" className="font-bold text-xl text-slate-900 dark:text-white">
                  AI Resume Optimizer
                </a>
                <AuthButton />
              </div>
            </header>
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
