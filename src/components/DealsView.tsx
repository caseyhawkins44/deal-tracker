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
  Prospecting: "bg-blue-100 text-blue-700",
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
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <div className="flex items-center gap-1">
        <p className={`text-sm font-semibold ${positive ? "text-green-600" : "text-red-500"}`}>{value}</p>
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
                className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="font-semibold text-gray-900">{deal.name}</h2>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          STATUS_COLORS[deal.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {deal.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {deal.address}, {deal.city}, {deal.state} · {deal.propertyType}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Added by {deal.addedByName}</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{fmt(deal.purchasePrice)}</p>
                </div>
                <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
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
                    dot={metricDot(m.grossYield, criteria.minCapRate)}
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
