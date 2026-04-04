import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import NavBar from "@/components/NavBar"
import DealForm from "@/components/DealForm"

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params
  const deal = await prisma.deal.findUnique({ where: { id } })
  if (!deal) notFound()

  return (
    <div className="min-h-screen">
      <NavBar user={session.user} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Edit Deal</h1>
        <DealForm
          dealId={deal.id}
          initialData={{
            ...deal,
            notes: deal.notes ?? "",
            zillowUrl: deal.zillowUrl ?? "",
          }}
        />
      </main>
    </div>
  )
}
