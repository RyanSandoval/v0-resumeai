import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthButton } from "@/components/auth/auth-button"
import { SessionProvider } from "@/components/auth/session-provider"
import { AuthDebug } from "@/components/auth/auth-debug"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Resume Optimizer",
  description:
    "Automatically tailor your resume to match job descriptions and stand out to recruiters and ATS systems.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                <a href="/" className="font-bold text-xl text-slate-900 dark:text-white">
                  AI Resume Optimizer
                </a>
                <AuthButton />
              </div>
            </header>
            {children}
            {process.env.NODE_ENV === "development" && <AuthDebug />}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
