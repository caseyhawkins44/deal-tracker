import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import NavBar from "@/components/NavBar"
import DealForm from "@/components/DealForm"

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<{ z?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const params = await searchParams
  let prefill: Record<string, unknown> = {}

  if (params.z) {
    try {
      prefill = JSON.parse(Buffer.from(params.z, "base64").toString("utf-8"))
    } catch {
      // ignore malformed param
    }
  }

  return (
    <div className="min-h-screen">
      <NavBar user={session.user} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Add New Deal</h1>
        {params.z && Object.keys(prefill).length > 0 && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
            Listing imported from Zillow — review and fill in the remaining fields below.
          </div>
        )}
        <DealForm initialData={prefill} />
      </main>
    </div>
  )
}
