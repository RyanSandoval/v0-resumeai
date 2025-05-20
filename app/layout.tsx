import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { SiteLayout } from "@/components/layout/site-layout"
import { SessionProvider } from "@/components/auth/session-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Resume Optimizer",
  description: "A tool to optimize your resume for job applications",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <SiteLayout>{children}</SiteLayout>
        </SessionProvider>
      </body>
    </html>
  )
}
