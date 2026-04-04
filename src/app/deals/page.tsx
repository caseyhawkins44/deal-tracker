import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Deal } from "@/generated/prisma/client"
import { redirect } from "next/navigation"
import Link from "next/link"
import { analyzeDeal, fmt, fmtPct } from "@/lib/calculations"
import NavBar from "@/components/NavBar"

const STATUS_COLORS: Record<string, string> = {
  Prospecting: "bg-blue-100 text-blue-700",
  "Under Analysis": "bg-yellow-100 text-yellow-700",
  "Offer Made": "bg-purple-100 text-purple-700",
  Passed: "bg-gray-100 text-gray-600",
}

export default async function DealsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const deals = await prisma.deal.findMany({
    include: { addedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen">
      <NavBar user={session.user} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Prospective Deals</h1>
            <p className="text-gray-500 text-sm">{deals.length} deal{deals.length !== 1 ? "s" : ""} tracked</p>
          </div>
          <div className="flex gap-3">
            {deals.length >= 2 && (
              <Link
                href="/compare"
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Compare Deals
              </Link>
            )}
            <Link
              href="/deals/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + Add Deal
            </Link>
          </div>
        </div>

        {deals.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-400 text-lg mb-4">No deals yet</p>
            <Link
              href="/deals/new"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Add your first deal
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {deals.map((deal: Deal & { addedBy: { name: string | null } }) => {
              const m = analyzeDeal(deal)
              const isPositive = m.monthlyCashFlow >= 0
              return (
                <Link
                  key={deal.id}
                  href={`/deals/${deal.id}`}
                  className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h2 className="font-semibold text-gray-900">{deal.name}</h2>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[deal.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {deal.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{deal.address}, {deal.city}, {deal.state} · {deal.propertyType}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Added by {deal.addedBy.name}</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{fmt(deal.purchasePrice)}</p>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
                    <Metric label="Cash Flow/mo" value={fmt(m.monthlyCashFlow)} positive={isPositive} />
                    <Metric label="Cap Rate" value={fmtPct(m.capRate)} positive={m.capRate >= 5} />
                    <Metric label="Cash-on-Cash" value={fmtPct(m.cashOnCash)} positive={m.cashOnCash >= 8} />
                    <Metric label="Gross Yield" value={fmtPct(m.grossYield)} positive={m.grossYield >= 8} />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

function Metric({ label, value, positive }: { label: string; value: string; positive: boolean; }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${positive ? "text-green-600" : "text-red-500"}`}>{value}</p>
    </div>
  )
}
