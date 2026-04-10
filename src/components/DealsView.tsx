"use client"

import { useState } from "react"
import Link from "next/link"
import { analyzeDeal, fmt, fmtPct } from "@/lib/calculations"
import { metricDot, type InvestmentCriteriaType } from "@/lib/criteria"
import DealsMapClient from "./DealsMapClient"

export type SerializedDeal = {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  propertyType: string
  status: string
  purchasePrice: number
  downPaymentPct: number
  closingCosts: number
  rehabCosts: number
  monthlyRent: number
  propertyTax: number
  insurance: number
  maintenance: number
  utilities: number
  hoaFees: number
  interestRate: number
  loanTermYears: number
  vacancyRate: number
  managementFee: number
  zillowUrl: string | null
  addedByName: string | null
}

const STATUS_COLORS: Record<string, string> = {
  Prospecting: "bg-[#e8f1fb] text-[#0071e3]",
  "Under Analysis": "bg-yellow-100 text-yellow-700",
  "Offer Made": "bg-purple-100 text-purple-700",
  Passed: "bg-gray-100 text-gray-600",
}

const DOT_COLORS = {
  green: "bg-green-500",
  amber: "bg-amber-400",
  red: "bg-red-500",
}

function Metric({
  label,
  value,
  positive,
  dot,
}: {
  label: string
  value: string
  positive: boolean
  dot: "green" | "amber" | "red"
}) {
  return (
    <div>
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        <p className={`text-lg font-bold ${positive ? "text-green-600" : "text-red-500"}`}>{value}</p>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_COLORS[dot]}`} />
      </div>
    </div>
  )
}

export default function DealsView({
  deals,
  criteria,
}: {
  deals: SerializedDeal[]
  criteria: InvestmentCriteriaType
}) {
  const [view, setView] = useState<"list" | "map">("list")

  return (
    <div>
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setView("list")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            view === "list" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          List
        </button>
        <button
          onClick={() => setView("map")}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            view === "map" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Map
        </button>
      </div>

      {view === "map" ? (
        <DealsMapClient deals={deals} />
      ) : (
        <div className="grid gap-4">
          {deals.map((deal) => {
            const m = analyzeDeal(deal)
            const isPositive = m.monthlyCashFlow >= 0
            return (
              <Link
                key={deal.id}
                href={`/deals/${deal.id}`}
                className="bg-white border border-black/[0.07] rounded-[18px] shadow-sm p-6 hover:border-[#0071e3]/30 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <h2 className="text-lg font-bold text-gray-900">{deal.name}</h2>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          STATUS_COLORS[deal.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {deal.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {deal.address}, {deal.city}, {deal.state} · {deal.propertyType}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Added by {deal.addedByName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">Price</p>
                    <p className="text-2xl font-bold text-gray-900">{fmt(deal.purchasePrice)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 pt-5 border-t border-black/[0.05]">
                  <Metric
                    label="Cash Flow/mo"
                    value={fmt(m.monthlyCashFlow)}
                    positive={isPositive}
                    dot={metricDot(m.monthlyCashFlow, criteria.minMonthlyCashFlow)}
                  />
                  <Metric
                    label="Cap Rate"
                    value={fmtPct(m.capRate)}
                    positive={m.capRate >= 5}
                    dot={metricDot(m.capRate, criteria.minCapRate)}
                  />
                  <Metric
                    label="Cash-on-Cash"
                    value={fmtPct(m.cashOnCash)}
                    positive={m.cashOnCash >= 8}
                    dot={metricDot(m.cashOnCash, criteria.minCashOnCash)}
                  />
                  <Metric
                    label="Gross Yield"
                    value={fmtPct(m.grossYield)}
                    positive={m.grossYield >= 8}
                    dot={metricDot(m.grossYield, 8)}
                  />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
