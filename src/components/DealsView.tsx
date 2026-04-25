"use client"

import { useState, useMemo } from "react"
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
  capexReserve: number
  zillowUrl: string | null
  addedByName: string | null
  projectId: string | null
  projectName: string | null
}

type SortField = "purchasePrice" | "monthlyCashFlow" | "capRate" | "cashOnCash" | "grossYield"
type SortDir = "asc" | "desc"

const SORT_LABELS: Record<SortField, string> = {
  purchasePrice: "Price",
  monthlyCashFlow: "Cash Flow",
  capRate: "Cap Rate",
  cashOnCash: "Cash-on-Cash",
  grossYield: "Gross Yield",
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
  label, value, positive, dot,
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

const selectCls = "bg-white border border-black/[0.10] rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3]/50 cursor-pointer"

export default function DealsView({
  deals,
  criteria,
}: {
  deals: SerializedDeal[]
  criteria: InvestmentCriteriaType
}) {
  const [view, setView] = useState<"list" | "map">("list")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterProject, setFilterProject] = useState("")
  const [filterAddedBy, setFilterAddedBy] = useState("")
  const [sortField, setSortField] = useState<SortField>("purchasePrice")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  // Derive unique filter options from deal data
  const statuses = useMemo(() => [...new Set(deals.map(d => d.status))].sort(), [deals])
  const projects = useMemo(() => {
    const seen = new Map<string, string>()
    for (const d of deals) {
      if (d.projectId && d.projectName) seen.set(d.projectId, d.projectName)
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [deals])
  const addedByOptions = useMemo(
    () => [...new Set(deals.map(d => d.addedByName).filter(Boolean) as string[])].sort(),
    [deals]
  )

  const hasFilters = filterStatus || filterProject || filterAddedBy

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === "desc" ? "asc" : "desc")
    } else {
      setSortField(field)
      setSortDir(field === "purchasePrice" ? "asc" : "desc")
    }
  }

  const processed = useMemo(() => {
    let result = deals

    if (filterStatus) result = result.filter(d => d.status === filterStatus)
    if (filterProject === "__unassigned__") {
      result = result.filter(d => !d.projectId)
    } else if (filterProject) {
      result = result.filter(d => d.projectId === filterProject)
    }
    if (filterAddedBy) result = result.filter(d => d.addedByName === filterAddedBy)

    result = [...result].sort((a, b) => {
      const ma = analyzeDeal(a)
      const mb = analyzeDeal(b)
      const va = sortField === "purchasePrice" ? a.purchasePrice : ma[sortField]
      const vb = sortField === "purchasePrice" ? b.purchasePrice : mb[sortField]
      return sortDir === "desc" ? vb - va : va - vb
    })

    return result
  }, [deals, filterStatus, filterProject, filterAddedBy, sortField, sortDir])

  return (
    <div>
      {/* View toggle + filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
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

        <div className="w-px h-5 bg-black/[0.10] hidden sm:block" />

        {/* Filters */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {projects.length > 0 && (
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className={selectCls}>
            <option value="">All Projects</option>
            <option value="__unassigned__">Unassigned</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}

        {addedByOptions.length > 1 && (
          <select value={filterAddedBy} onChange={e => setFilterAddedBy(e.target.value)} className={selectCls}>
            <option value="">All Users</option>
            {addedByOptions.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        )}

        {hasFilters && (
          <button
            onClick={() => { setFilterStatus(""); setFilterProject(""); setFilterAddedBy("") }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear filters
          </button>
        )}

        <div className="w-px h-5 bg-black/[0.10] hidden sm:block" />

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Sort:</span>
          <div className="flex gap-1">
            {(Object.keys(SORT_LABELS) as SortField[]).map(field => (
              <button
                key={field}
                onClick={() => toggleSort(field)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                  sortField === field
                    ? "bg-[#0071e3] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {SORT_LABELS[field]}
                {sortField === field && (
                  <span className="text-[10px] leading-none">{sortDir === "desc" ? "↓" : "↑"}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result count when filtered */}
      {hasFilters && (
        <p className="text-sm text-gray-500 mb-4">
          Showing {processed.length} of {deals.length} deal{deals.length !== 1 ? "s" : ""}
        </p>
      )}

      {view === "map" ? (
        <DealsMapClient deals={processed} />
      ) : processed.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[18px] border border-black/[0.07] shadow-sm">
          <p className="text-gray-400">No deals match your filters.</p>
          <button
            onClick={() => { setFilterStatus(""); setFilterProject(""); setFilterAddedBy("") }}
            className="mt-3 text-sm text-[#0071e3] hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {processed.map((deal) => {
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
                      {deal.projectName && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                          {deal.projectName}
                        </span>
                      )}
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
