"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"

type User = { name?: string | null; email?: string | null }

export default function NavBar({ user }: { user: User }) {
  return (
    <nav className="bg-white border-b border-gray-200 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href="/deals" className="font-bold text-gray-900 text-base">
            Deal Tracker
          </Link>
          <Link href="/deals" className="text-sm text-gray-600 hover:text-gray-900">
            Deals
          </Link>
          <Link href="/compare" className="text-sm text-gray-600 hover:text-gray-900">
            Compare
          </Link>
          <Link href="/bookmarklet" className="text-sm text-gray-600 hover:text-gray-900">
            Zillow Import
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user.name ?? user.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
