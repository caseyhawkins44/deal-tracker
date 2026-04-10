"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

type User = { name?: string | null; email?: string | null; role?: string | null }

export default function NavBar({ user }: { user: User }) {
  const pathname = usePathname()

  function navLink(href: string, label: string) {
    const active = pathname === href || (href !== "/" && pathname.startsWith(href))
    return (
      <Link
        href={href}
        className={`text-sm transition-colors ${
          active ? "text-gray-900 font-semibold" : "text-gray-400 hover:text-gray-700"
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-black/[0.07]">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-base font-bold tracking-tight text-gray-900">
            Deal Tracker
          </Link>
          <div className="flex items-center gap-6">
            {navLink("/", "Dashboard")}
            {navLink("/deals", "Deals")}
            {navLink("/projects", "Projects")}
            {navLink("/compare", "Compare")}
            {navLink("/bookmarklet", "Zillow Import")}
            {user.role === "admin" && (
              <Link href="/admin" className="text-sm text-purple-500 hover:text-purple-700 transition-colors font-medium">
                Admin
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-sm text-gray-400">{user.name ?? user.email}</span>
          <Link href="/settings" className="text-gray-400 hover:text-gray-700 transition-colors" title="Settings">
            <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-400 hover:text-gray-900 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
