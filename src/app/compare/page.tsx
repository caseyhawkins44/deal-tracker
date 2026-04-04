import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import NavBar from "@/components/NavBar"
import CompareView from "@/components/CompareView"

export default async function ComparePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const deals = await prisma.deal.findMany({
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen">
      <NavBar user={session.user} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Compare Deals</h1>
        <p className="text-gray-500 text-sm mb-6">Select up to 4 deals to compare side-by-side</p>
        <CompareView deals={deals} />
      </main>
    </div>
  )
}
