"use client"

import { useState } from "react"
import type { InvestmentCriteriaType } from "@/lib/criteria"
import InfoTooltip from "@/components/InfoTooltip"

type Criteria = InvestmentCriteriaType

const METRICS: {
  key: keyof Criteria
  ignoreKey: keyof Criteria
  label: string
  tooltip: string
  unit: string
  prefix?: string
  step: number
  min: number
  higherIsBetter: boolean
}[] = [
  {
    key: "minMonthlyCashFlow", ignoreKey: "ignoreCashFlow",
    label: "Monthly Cash Flow", unit: "/mo", prefix: "$", step: 25, min: 0, higherIsBetter: true,
    tooltip: "Net income after every expense including mortgage. This is the cash that actually hits your account each month. $200+/door is a common investor target — $100 is a conservative floor.",
  },
  {
    key: "minCapRate", ignoreKey: "ignoreCapRate",
    label: "Cap Rate", unit: "%", step: 0.5, min: 0, higherIsBetter: true,
    tooltip: "Net Operating Income ÷ Purchase Price. Measures the property's return independent of how it's financed — useful for comparing deals apples-to-apples. 6%+ is generally solid; 8%+ is strong in most markets.",
  },
  {
    key: "minCashOnCash", ignoreKey: "ignoreCashOnCash",
    label: "Cash-on-Cash Return", unit: "%", step: 0.5, min: 0, higherIsBetter: true,
    tooltip: "Annual cash flow ÷ Total cash invested (down payment + closing costs + rehab). Your actual return on the dollars you put in — the most investor-relevant metric. 8% is a common target; 10–12%+ is excellent.",
  },
  {
    key: "minDscr", ignoreKey: "ignoreDscr",
    label: "DSCR", unit: "×", step: 0.05, min: 0, higherIsBetter: true,
    tooltip: "Debt Service Coverage Ratio: NOI ÷ Annual mortgage payments. A DSCR of 1.25× means the property earns 25% more than it costs to service the debt. Lenders typically require 1.20–1.25×; below 1.0× means the rent doesn't cover the mortgage.",
  },
  {
    key: "maxGrm", ignoreKey: "ignoreGrm",
    label: "GRM", unit: "×", step: 0.5, min: 0, higherIsBetter: false,
    tooltip: "Gross Rent Multiplier: Purchase Price ÷ Annual Gross Rent. A quick screening filter — how many years of gross rent equals the asking price. Lower is better. Under 10× is favorable; under 7× is excellent. This is a maximum, not a minimum.",
  },
]

function formatValue(value: number, prefix?: string, unit?: string) {
  if (prefix === "$") return `$${value.toLocaleString()}${unit}`
  return `${value}${unit}`
}

export default function InvestmentCriteriaPanel({
  initialCriteria,
}: {
  initialCriteria: Criteria
}) {
  const [criteria, setCriteria] = useState<Criteria>(initialCriteria)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Criteria>(initialCriteria)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  function startEdit() {
    setDraft(criteria)
    setSaveError("")
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setSaveError("")
  }

  function updateDraft(field: keyof Criteria, value: number | boolean) {
    setDraft(d => ({ ...d, [field]: value }))
  }

  async function save() {
    setSaving(true)
    setSaveError("")
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSaveError(data.error ?? "Failed to save.")
        return
      }
      const saved = await res.json()
      setCriteria(saved)
      setEditing(false)
    } catch {
      setSaveError("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-black/[0.07] rounded-[18px] shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold text-gray-900">Investment Criteria</h2>
          <p className="text-xs text-gray-400 mt-0.5">Thresholds used to evaluate all deals</p>
        </div>
        {!editing && (
          <button
            onClick={startEdit}
            className="border border-black/[0.12] text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-black/[0.04] transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          {METRICS.map(({ key, ignoreKey, label, tooltip, unit, prefix, step, min, higherIsBetter }) => {
            const ignored = draft[ignoreKey] as boolean
            return (
              <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${ignored ? "border-gray-100 bg-gray-50" : "border-black/[0.07] bg-white"}`}>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium flex items-center ${ignored ? "text-gray-400" : "text-gray-700"}`}>
                    {label}
                    <InfoTooltip content={tooltip} />
                  </p>
                  <p className="text-[11px] text-gray-400">{higherIsBetter ? "minimum" : "maximum"}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {prefix === "$" && <span className={`text-sm ${ignored ? "text-gray-300" : "text-gray-500"}`}>$</span>}
                  <input
                    type="number"
                    step={step}
                    min={min}
                    disabled={ignored}
                    value={draft[key] as number}
                    onChange={e => updateDraft(key, parseFloat(e.target.value) || 0)}
                    className="w-20 text-right bg-black/[0.03] border border-black/[0.10] rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  <span className={`text-sm w-5 ${ignored ? "text-gray-300" : "text-gray-500"}`}>{unit}</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateDraft(ignoreKey, !ignored)}
                  className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    ignored
                      ? "bg-gray-100 text-gray-400 hover:bg-gray-200"
                      : "bg-green-50 text-green-700 hover:bg-green-100"
                  }`}
                >
                  {ignored ? "Ignored" : "Active"}
                </button>
              </div>
            )
          })}

          {saveError && <p className="text-sm text-red-500">{saveError}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={saving}
              className="bg-[#0071e3] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#0065d1] disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button
              onClick={cancelEdit}
              disabled={saving}
              className="border border-black/[0.12] text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/[0.04] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {METRICS.map(({ key, ignoreKey, label, tooltip, unit, prefix, higherIsBetter }) => {
            const ignored = criteria[ignoreKey] as boolean
            const value = criteria[key] as number
            return (
              <div key={key} className={`flex items-center justify-between py-2 border-b border-gray-50 last:border-0 ${ignored ? "opacity-40" : ""}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ignored ? "bg-gray-300" : "bg-green-500"}`} />
                  <span className="text-sm text-gray-700 flex items-center">
                    {label}
                    <InfoTooltip content={tooltip} />
                  </span>
                  {ignored && <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">ignored</span>}
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {higherIsBetter ? "≥ " : "≤ "}
                  {formatValue(value, prefix, unit)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
