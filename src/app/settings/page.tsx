import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import NavBar from "@/components/NavBar"
import SettingsForm from "@/components/SettingsForm"
import { DEFAULT_CRITERIA } from "@/lib/criteria"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const criteria = await prisma.investmentCriteria.findUnique({ where: { id: "singleton" } })

  return (
    <div className="min-h-screen">
      <NavBar user={session.user} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">Investment Criteria</h1>
        <p className="text-gray-500 text-sm mb-8">
          Team-wide thresholds used to color-code metrics on deal cards and detail pages.
          Green = meets target · Amber = within 20% below · Red = misses by more than 20%.
        </p>
        <SettingsForm initialValues={criteria ?? { id: "singleton", ...DEFAULT_CRITERIA }} />
      </main>
    </div>
  )
}
