"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Menu, X, User, FileText, Settings, LogOut } from "lucide-react"
import { OptimizedImage } from "@/components/ui/image"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "next-auth/react"

export function Header() {
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <header className="w-full bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-700">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <OptimizedImage
            src="/logo.png"
            alt="Resume Optimizer Logo"
            width={40}
            height={40}
            className="h-10 w-10"
            fallbackSrc="/abstract-logo.png"
            priority
          />
          <span className="text-xl font-bold">Resume Optimizer</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-slate-600 hover:text-primary dark:text-slate-300">
            Home
          </Link>
          <Link href="/features" className="text-slate-600 hover:text-primary dark:text-slate-300">
            Features
          </Link>
          <Link href="/pricing" className="text-slate-600 hover:text-primary dark:text-slate-300">
            Pricing
          </Link>
          {session ? (
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer flex w-full">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/account" className="cursor-pointer flex w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="cursor-pointer text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/auth/signin?signup=true">
                <Button>Get Started</Button>
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 px-4 py-2 border-t border-slate-200 dark:border-slate-700">
          <nav className="flex flex-col space-y-3 py-3">
            <Link
              href="/"
              className="text-slate-600 hover:text-primary py-2 dark:text-slate-300"
              onClick={toggleMobileMenu}
            >
              Home
            </Link>
            <Link
              href="/features"
              className="text-slate-600 hover:text-primary py-2 dark:text-slate-300"
              onClick={toggleMobileMenu}
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="text-slate-600 hover:text-primary py-2 dark:text-slate-300"
              onClick={toggleMobileMenu}
            >
              Pricing
            </Link>
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-slate-600 hover:text-primary py-2 dark:text-slate-300"
                  onClick={toggleMobileMenu}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/account"
                  className="text-slate-600 hover:text-primary py-2 dark:text-slate-300"
                  onClick={toggleMobileMenu}
                >
                  Settings
                </Link>
                <button
                  onClick={() => {
                    signOut({ callbackUrl: "/" })
                    toggleMobileMenu()
                  }}
                  className="text-red-600 hover:text-red-700 py-2 text-left"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="text-slate-600 hover:text-primary py-2 dark:text-slate-300"
                  onClick={toggleMobileMenu}
                >
                  Sign In
                </Link>
                <Link href="/auth/signin?signup=true" onClick={toggleMobileMenu}>
                  <Button className="w-full">Get Started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
