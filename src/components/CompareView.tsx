"use client"

import { useState } from "react"
import Link from "next/link"
import { analyzeDeal, fmt, fmtPct } from "@/lib/calculations"
import InfoTooltip from "@/components/InfoTooltip"

const RETURN_TOOLTIPS: Record<string, string> = {
  "Monthly Cash Flow": "Effective rent minus all monthly expenses (mortgage, taxes, insurance, maintenance, utilities, HOA, management). Guideline: $200+/door/month is a common target.",
  "Annual Cash Flow": "Monthly cash flow × 12. The total dollars you keep per year after all expenses. Guideline: Positive is the baseline; higher is better.",
  "Cap Rate": "NOI ÷ Purchase Price. Compares properties independent of financing. Guideline: 5%+ is solid; 7–10%+ is strong in secondary markets.",
  "Cash-on-Cash Return": "Annual cash flow ÷ Total cash invested (down payment + closing costs + rehab). Your actual return on invested dollars. Guideline: 8%+ is a common target; 10–12%+ is excellent.",
  "Gross Yield": "Annual gross rent ÷ Purchase price. A quick screening metric before expenses. Guideline: 8%+ to warrant deeper analysis.",
  "GRM": "Gross Rent Multiplier: Purchase price ÷ Annual gross rent. How many years of gross rent equals the price. Guideline: Under 10× is favorable; under 7× is excellent.",
}

type Deal = {
  id: string
  name: string
  address: string
  city: string
  state: string
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
  status: string
}

export default function CompareView({ deals }: { deals: Deal[] }) {
  const [selected, setSelected] = useState<string[]>([])

  function toggle(id: string) {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 4
        ? [...prev, id]
        : prev
    )
  }

  const selectedDeals = deals.filter(d => selected.includes(d.id))

  return (
    <div className="space-y-6">
      {/* Deal Selector */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-sm font-medium text-gray-700 mb-3">Choose deals to compare ({selected.length}/4 selected)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {deals.map(deal => (
            <button
              key={deal.id}
              onClick={() => toggle(deal.id)}
              className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                selected.includes(deal.id)
                  ? "border-blue-500 bg-blue-50 text-blue-800"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="font-medium">{deal.name}</p>
              <p className="text-xs text-gray-500">{deal.city}, {deal.state} · {fmt(deal.purchasePrice)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      {selectedDeals.length >= 2 && (() => {
        const metrics = selectedDeals.map(d => analyzeDeal(d))
        return (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 w-44">Metric</th>
                    {selectedDeals.map(d => (
                      <th key={d.id} className="text-left px-5 py-3">
                        <Link href={`/deals/${d.id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                          {d.name}
                        </Link>
                        <p className="text-xs text-gray-400 font-normal">{d.city}, {d.state}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <SectionRow label="Overview" cols={selectedDeals.length} />
                  <CompareRow
                    label="Purchase Price"
                    values={selectedDeals.map(d => fmt(d.purchasePrice))}
                    rawValues={selectedDeals.map(d => d.purchasePrice)}
                    higherIsBetter={false}
                  />
                  <CompareRow
                    label="Total Invested"
                    values={metrics.map(m => fmt(m.totalInvested))}
                    rawValues={metrics.map(m => m.totalInvested)}
                    higherIsBetter={false}
                  />
                  <CompareRow
                    label="Monthly Rent"
                    values={selectedDeals.map(d => fmt(d.monthlyRent))}
                    rawValues={selectedDeals.map(d => d.monthlyRent)}
                    higherIsBetter={true}
                  />

                  <SectionRow label="Returns" cols={selectedDeals.length} />
                  <CompareRow
                    label="Monthly Cash Flow"
                    values={metrics.map(m => fmt(m.monthlyCashFlow))}
                    rawValues={metrics.map(m => m.monthlyCashFlow)}
                    higherIsBetter={true}
                    colorize
                  />
                  <CompareRow
                    label="Annual Cash Flow"
                    values={metrics.map(m => fmt(m.annualCashFlow))}
                    rawValues={metrics.map(m => m.annualCashFlow)}
                    higherIsBetter={true}
                    colorize
                  />
                  <CompareRow
                    label="Cap Rate"
                    values={metrics.map(m => fmtPct(m.capRate))}
                    rawValues={metrics.map(m => m.capRate)}
                    higherIsBetter={true}
                    colorize
                  />
                  <CompareRow
                    label="Cash-on-Cash Return"
                    values={metrics.map(m => fmtPct(m.cashOnCash))}
                    rawValues={metrics.map(m => m.cashOnCash)}
                    higherIsBetter={true}
                    colorize
                  />
                  <CompareRow
                    label="Gross Yield"
                    values={metrics.map(m => fmtPct(m.grossYield))}
                    rawValues={metrics.map(m => m.grossYield)}
                    higherIsBetter={true}
                  />
                  <CompareRow
                    label="GRM"
                    values={metrics.map(m => `${m.grm.toFixed(1)}x`)}
                    rawValues={metrics.map(m => m.grm)}
                    higherIsBetter={false}
                  />

                  <SectionRow label="Financing" cols={selectedDeals.length} />
                  <CompareRow
                    label="Down Payment %"
                    values={selectedDeals.map(d => `${d.downPaymentPct}%`)}
                    rawValues={selectedDeals.map(d => d.downPaymentPct)}
                    higherIsBetter={false}
                  />
                  <CompareRow
                    label="Interest Rate"
                    values={selectedDeals.map(d => `${d.interestRate}%`)}
                    rawValues={selectedDeals.map(d => d.interestRate)}
                    higherIsBetter={false}
                  />
                  <CompareRow
                    label="Monthly Mortgage"
                    values={metrics.map(m => fmt(m.monthlyMortgage))}
                    rawValues={metrics.map(m => m.monthlyMortgage)}
                    higherIsBetter={false}
                  />
                </tbody>
              </table>
            </div>
          </div>
        )
      })()}

      {selectedDeals.length === 1 && (
        <p className="text-sm text-gray-500 text-center py-6">Select at least one more deal to compare</p>
      )}
    </div>
  )
}

function SectionRow({ label, cols }: { label: string; cols: number }) {
  return (
    <tr className="bg-gray-50 border-t border-gray-200">
      <td colSpan={cols + 1} className="px-5 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </td>
    </tr>
  )
}

function CompareRow({
  label,
  values,
  rawValues,
  higherIsBetter,
  colorize,
}: {
  label: string
  values: string[]
  rawValues: number[]
  higherIsBetter: boolean
  colorize?: boolean
}) {
  const best = higherIsBetter ? Math.max(...rawValues) : Math.min(...rawValues)
  const tooltip = RETURN_TOOLTIPS[label]

  return (
    <tr className="border-t border-gray-100">
      <td className="px-5 py-3 text-gray-600">
        <span className="flex items-center gap-0.5">
          {label}
          {tooltip && <InfoTooltip content={tooltip} />}
        </span>
      </td>
      {values.map((val, i) => {
        const isBest = rawValues[i] === best && rawValues.filter(v => v === best).length < rawValues.length
        const isPositive = colorize ? rawValues[i] >= 0 : null
        return (
          <td
            key={i}
            className={`px-5 py-3 font-medium ${
              isPositive === true ? "text-green-600" :
              isPositive === false ? "text-red-500" :
              isBest ? "text-blue-600" : "text-gray-900"
            }`}
          >
            {val}
            {isBest && !colorize && (
              <span className="ml-1.5 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">best</span>
            )}
          </td>
        )
      })}
    </tr>
  )
}
