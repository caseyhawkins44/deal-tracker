import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import NavBar from "@/components/NavBar"
import BookmarkletInstallerClient from "@/components/BookmarkletInstallerClient"

export default async function BookmarkletPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <div className="min-h-screen">
      <NavBar user={session.user} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Zillow Bookmarklet</h1>
        <p className="text-gray-500 text-sm mb-8">
          Add this button to your bookmarks bar. When you&apos;re on a Zillow listing, click it to instantly import the property into Deal Tracker.
        </p>
        <BookmarkletInstallerClient />
      </main>
    </div>
  )
}
