import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import NavBar from "@/components/NavBar"
import InfoTooltip from "@/components/InfoTooltip"
import DealVoting from "@/components/DealVoting"
import DealComments from "@/components/DealComments"
import DealActivity from "@/components/DealActivity"
import { analyzeDeal, fmt, fmtPct } from "@/lib/calculations"
import { DEFAULT_CRITERIA, metricDot, type InvestmentCriteriaType } from "@/lib/criteria"
import DeleteDealButton from "@/components/DeleteDealButton"
import ZillowRefreshButton from "@/components/ZillowRefreshButton"
import ScenarioAnalyzer from "@/components/ScenarioAnalyzer"
import AISummaryPanel from "@/components/AISummaryPanel"

const TOOLTIPS = {
  cashFlow:
    "Monthly rent minus all expenses: mortgage P&I, property tax, insurance, maintenance, utilities, HOA, vacancy allowance, and management fee.\n\nGuideline: $200+/door/month is a common investor target. Negative means you're losing money each month.",
  capRate:
    "Net Operating Income (NOI) ÷ Purchase Price. Measures the property's return ignoring financing — useful for comparing properties regardless of how they're funded.\n\nGuideline: 5%+ is generally solid. High-cost markets (NYC, SF): 4–6%. Secondary markets: 7–10%+.",
  cashOnCash:
    "Annual cash flow ÷ Total cash invested (down payment + closing costs + rehab). Your actual return on the dollars you put in.\n\nGuideline: 8%+ is a common target. 10–12%+ is excellent.",
  grossYield:
    "Annual gross rent ÷ Purchase price. A quick screening metric — does not account for expenses or vacancy.\n\nGuideline: 8%+ suggests the deal may pencil out. Always verify with cap rate and cash-on-cash.",
}

const DOT_COLORS = {
  green: "bg-green-500",
  amber: "bg-amber-400",
  red: "bg-red-500",
}

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params
  const [deal, criteriaRow] = await Promise.all([
    prisma.deal.findUnique({
      where: { id },
      include: { addedBy: { select: { name: true, email: true } } },
    }),
    prisma.investmentCriteria.findUnique({ where: { id: "singleton" } }),
  ])

  if (!deal) notFound()

  const m = analyzeDeal(deal)
  const c: InvestmentCriteriaType = criteriaRow ?? DEFAULT_CRITERIA

  return (
    <div className="min-h-screen">
      <NavBar user={session.user} />
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="mb-3">
              <Link href="/deals" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">← Deals</Link>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-1.5">{deal.name}</h1>
            <p className="text-gray-500 text-base">{deal.address}, {deal.city}, {deal.state} {deal.zipCode} · {deal.propertyType}</p>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-xs text-gray-400">Added by {deal.addedBy.name}</p>
              {deal.zillowUrl && (
                <a
                  href={deal.zillowUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#0071e3] hover:underline flex items-center gap-1"
                >
                  View on Zillow ↗
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <Link
                href={`/deals/${deal.id}/edit`}
                className="border border-black/[0.12] text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/[0.04]"
              >
                Edit
              </Link>
              <DeleteDealButton dealId={deal.id} />
            </div>
            <ZillowRefreshButton dealId={deal.id} zillowUrl={deal.zillowUrl ?? null} />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          <BigMetric
            label="Monthly Cash Flow"
            tooltip={TOOLTIPS.cashFlow}
            value={fmt(m.monthlyCashFlow)}
            sub="after all expenses + mortgage"
            positive={m.monthlyCashFlow >= 0}
            dot={metricDot(m.monthlyCashFlow, c.minMonthlyCashFlow, true, c.ignoreCashFlow)}
          />
          <BigMetric
            label="Cap Rate"
            tooltip={TOOLTIPS.capRate}
            value={fmtPct(m.capRate)}
            sub="NOI ÷ purchase price"
            positive={m.capRate >= 5}
            dot={metricDot(m.capRate, c.minCapRate, true, c.ignoreCapRate)}
          />
          <BigMetric
            label="Cash-on-Cash"
            tooltip={TOOLTIPS.cashOnCash}
            value={fmtPct(m.cashOnCash)}
            sub="annual cash flow ÷ invested"
            positive={m.cashOnCash >= 8}
            dot={metricDot(m.cashOnCash, c.minCashOnCash, true, c.ignoreCashOnCash)}
          />
          <BigMetric
            label="Gross Yield"
            tooltip={TOOLTIPS.grossYield}
            value={fmtPct(m.grossYield)}
            sub="annual rent ÷ purchase price"
            positive={m.grossYield >= 8}
            dot={metricDot(m.grossYield, 8)}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Purchase Summary */}
          <div className="bg-white border border-black/[0.07] rounded-[18px] shadow-sm p-6">
            <h2 className="font-semibold mb-4">Purchase & Financing</h2>
            <dl className="space-y-2.5">
              <Row label="Purchase Price" value={fmt(deal.purchasePrice)} />
              <Row label="Down Payment" value={`${fmt(m.downPayment)} (${deal.downPaymentPct}%)`} />
              <Row label="Loan Amount" value={fmt(m.loanAmount)} />
              <Row label="Closing Costs" value={fmt(deal.closingCosts)} />
              <Row label="Rehab Costs" value={fmt(deal.rehabCosts)} />
              <div className="pt-2 border-t border-gray-100">
                <Row label="Total Invested" value={fmt(m.totalInvested)} bold />
              </div>
              <Row label="Interest Rate" value={`${deal.interestRate}% / ${deal.loanTermYears}yr`} />
              <Row label="Monthly Mortgage (P&I)" value={fmt(m.monthlyMortgage)} />
            </dl>
          </div>

          {/* Cash Flow Breakdown */}
          <div className="bg-white border border-black/[0.07] rounded-[18px] shadow-sm p-6">
            <h2 className="font-semibold mb-4">Monthly Cash Flow Breakdown</h2>
            <dl className="space-y-2.5">
              <Row label="Gross Rent" value={fmt(deal.monthlyRent)} />
              <Row label={`Vacancy (${deal.vacancyRate}%)`} value={`− ${fmt(deal.monthlyRent * deal.vacancyRate / 100)}`} />
              <div className="pt-2 border-t border-gray-100">
                <Row label="Effective Rent" value={fmt(m.effectiveRent)} bold />
              </div>
              <div className="pt-2 border-t border-gray-100 space-y-2.5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Monthly Expenses</p>
                <Row
                  label={`Property Tax (${fmt(deal.propertyTax)}/yr)`}
                  value={`− ${fmt(m.monthlyPropertyTax)}`}
                />
                <Row label="Insurance" value={`− ${fmt(deal.insurance)}`} />
                <Row label="Maintenance" value={`− ${fmt(deal.maintenance)}`} />
                <Row label="CapEx Reserve" value={`− ${fmt(deal.capexReserve)}`} />
                {deal.utilities > 0 && <Row label="Utilities" value={`− ${fmt(deal.utilities)}`} />}
                {deal.hoaFees > 0 && <Row label="HOA Fees" value={`− ${fmt(deal.hoaFees)}`} />}
                {deal.managementFee > 0 && (
                  <Row
                    label={`Mgmt Fee (${deal.managementFee}%)`}
                    value={`− ${fmt(m.effectiveRent * deal.managementFee / 100)}`}
                  />
                )}
                <Row label="Mortgage (P&I)" value={`− ${fmt(m.monthlyMortgage)}`} />
              </div>
              <div className="pt-2 border-t border-gray-100">
                <Row
                  label="Total Monthly Expenses"
                  value={`− ${fmt(m.monthlyOperatingExpenses + m.monthlyMortgage)}`}
                  bold
                />
              </div>
              <div className="pt-2 border-t border-gray-100">
                <Row
                  label="Net Cash Flow"
                  value={fmt(m.monthlyCashFlow)}
                  bold
                  colored={m.monthlyCashFlow >= 0 ? "green" : "red"}
                />
              </div>
            </dl>
          </div>
        </div>

        {/* Annual Summary */}
        <div className="bg-white border border-black/[0.07] rounded-[18px] shadow-sm p-6 mt-6">
          <h2 className="font-semibold mb-4">Annual Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Annual NOI</p>
              <p className="font-semibold">{fmt(m.annualNOI)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Annual Cash Flow</p>
              <p className={`font-semibold ${m.annualCashFlow >= 0 ? "text-green-600" : "text-red-500"}`}>
                {fmt(m.annualCashFlow)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">GRM</p>
              <div className="flex items-center gap-1.5">
                <p className="font-semibold">{m.grm.toFixed(1)}x</p>
                <span className={`w-2 h-2 rounded-full shrink-0 ${DOT_COLORS[metricDot(m.grm, c.maxGrm, false, c.ignoreGrm)]}`} />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">DSCR</p>
              <div className="flex items-center gap-1.5">
                <p className="font-semibold">{m.dscr === 999 ? "N/A (no debt)" : m.dscr.toFixed(2) + "x"}</p>
                <span className={`w-2 h-2 rounded-full shrink-0 ${DOT_COLORS[metricDot(m.dscr, c.minDscr, true, c.ignoreDscr)]}`} />
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <AISummaryPanel dealId={deal.id} />

        {deal.notes && (
          <div className="bg-white border border-black/[0.07] rounded-[18px] shadow-sm p-6 mt-6">
            <h2 className="font-semibold mb-2">Notes</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{deal.notes}</p>
          </div>
        )}

        {/* Scenario Analysis */}
        <ScenarioAnalyzer deal={deal} />

        {/* Comments */}
        <DealComments dealId={deal.id} currentUserId={session.user.id!} />

        {/* Activity Timeline */}
        <DealActivity dealId={deal.id} />

        {/* Voting */}
        <DealVoting dealId={deal.id} currentUserId={session.user.id!} />
      </main>
    </div>
  )
}

function BigMetric({
  label, tooltip, value, sub, positive, dot,
}: {
  label: string
  tooltip: string
  value: string
  sub: string
  positive: boolean
  dot: "green" | "amber" | "red"
}) {
  return (
    <div className="bg-white border border-black/[0.07] rounded-[18px] shadow-sm p-6">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1">
        {label}
        <InfoTooltip content={tooltip} />
        <span className={`w-2 h-2 rounded-full shrink-0 ml-0.5 ${DOT_COLORS[dot]}`} />
      </p>
      <p className={`text-4xl font-bold tracking-tight ${positive ? "text-green-600" : "text-red-500"}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-2">{sub}</p>
    </div>
  )
}

function Row({
  label, value, bold, colored,
}: {
  label: React.ReactNode
  value: string
  bold?: boolean
  colored?: "green" | "red"
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className={`text-gray-600 ${bold ? "font-medium" : ""}`}>{label}</span>
      <span className={`${bold ? "font-semibold" : ""} ${colored === "green" ? "text-green-600" : colored === "red" ? "text-red-500" : "text-gray-900"}`}>
        {value}
      </span>
    </div>
  )
}
