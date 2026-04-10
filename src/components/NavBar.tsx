"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

type User = { name?: string | null; email?: string | null; role?: string | null }

export default function NavBar({ user }: { user: User }) {
  const pathname = usePathname()

  function navLink(href: string, label: string) {
    const active = pathname === href || pathname.startsWith(href + "/")
    return (
      <Link
        href={href}
        className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
          active
            ? "bg-black/[0.06] text-gray-900 font-medium"
            : "text-gray-500 hover:text-gray-900 hover:bg-black/[0.04]"
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(255,255,255,0.75)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "rgba(0,0,0,0.08)",
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-1">
          <Link href="/" className="font-semibold text-gray-900 text-sm mr-3">
            Deal Tracker
          </Link>
          {navLink("/", "Dashboard")}
          {navLink("/deals", "Deals")}
          {navLink("/projects", "Projects")}
          {navLink("/compare", "Compare")}
          {navLink("/bookmarklet", "Zillow Import")}
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="text-sm px-3 py-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
            >
              Admin
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{user.name ?? user.email}</span>
          <Link
            href="/settings"
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-black/[0.04] transition-colors"
            title="Settings"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-400 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-black/[0.04] transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
