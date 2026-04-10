import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import NavBar from "@/components/NavBar"
import DealsView from "@/components/DealsView"
import type { SerializedDeal } from "@/components/DealsView"
import { DEFAULT_CRITERIA } from "@/lib/criteria"

export default async function DealsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const [deals, criteriaRow] = await Promise.all([
    prisma.deal.findMany({
      include: { addedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.investmentCriteria.findUnique({ where: { id: "singleton" } }),
  ])

  const criteria = criteriaRow ?? DEFAULT_CRITERIA

  const serialized: SerializedDeal[] = deals.map((d) => ({
    id: d.id,
    name: d.name,
    address: d.address,
    city: d.city,
    state: d.state,
    zipCode: d.zipCode,
    propertyType: d.propertyType,
    status: d.status,
    purchasePrice: d.purchasePrice,
    downPaymentPct: d.downPaymentPct,
    closingCosts: d.closingCosts,
    rehabCosts: d.rehabCosts,
    monthlyRent: d.monthlyRent,
    propertyTax: d.propertyTax,
    insurance: d.insurance,
    maintenance: d.maintenance,
    utilities: d.utilities,
    hoaFees: d.hoaFees,
    interestRate: d.interestRate,
    loanTermYears: d.loanTermYears,
    vacancyRate: d.vacancyRate,
    managementFee: d.managementFee,
    zillowUrl: d.zillowUrl,
    addedByName: d.addedBy.name,
  }))

  return (
    <div className="min-h-screen">
      <NavBar user={session.user} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Prospective Deals</h1>
            <p className="text-gray-500 text-sm">
              {deals.length} deal{deals.length !== 1 ? "s" : ""} tracked
            </p>
          </div>
          <div className="flex gap-3">
            {deals.length >= 2 && (
              <Link
                href="/compare"
                className="border border-black/[0.12] text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/[0.04]"
              >
                Compare Deals
              </Link>
            )}
            <Link
              href="/deals/new"
              className="bg-[#0071e3] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#0065d1]"
            >
              + Add Deal
            </Link>
          </div>
        </div>

        {deals.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[18px] border border-black/[0.07] shadow-sm">
            <p className="text-gray-400 text-lg mb-4">No deals yet</p>
            <Link
              href="/deals/new"
              className="bg-[#0071e3] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0065d1]"
            >
              Add your first deal
            </Link>
          </div>
        ) : (
          <DealsView deals={serialized} criteria={criteria} />
        )}
      </main>
    </div>
  )
}
