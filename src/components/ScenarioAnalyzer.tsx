"use client"

import { useState } from "react"
import { analyzeDeal, fmt, fmtPct, type Deal } from "@/lib/calculations"

type Scenario = Deal & { name: string }

const MAX_SCENARIOS = 3

function makeScenario(base: Deal, name: string): Scenario {
  return { ...base, name }
}

function NumInput({
  value,
  onChange,
  prefix,
  suffix,
  step = 0.5,
  min = 0,
}: {
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  step?: number
  min?: number
}) {
  return (
    <div className="flex items-center">
      {prefix && <span className="text-xs text-gray-400 mr-0.5">{prefix}</span>}
      <input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="w-full border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
      {suffix && <span className="text-xs text-gray-400 ml-0.5">{suffix}</span>}
    </div>
  )
}

const CASH_COLORS = (v: number) => v >= 200 ? "text-green-600" : v >= 0 ? "text-amber-600" : "text-red-500"
const PCT_COLORS = (v: number, threshold: number) => v >= threshold ? "text-green-600" : v >= threshold * 0.8 ? "text-amber-600" : "text-red-500"

export default function ScenarioAnalyzer({ deal }: { deal: Deal }) {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    makeScenario(deal, "Current Deal"),
    makeScenario(deal, "Scenario 2"),
  ])

  function updateScenario(i: number, field: keyof Scenario, value: string | number) {
    setScenarios(s => s.map((sc, idx) => idx === i ? { ...sc, [field]: value } : sc))
  }

  function addScenario() {
    setScenarios(s => [...s, makeScenario(deal, `Scenario ${s.length + 1}`)])
  }

  function removeScenario(i: number) {
    setScenarios(s => s.filter((_, idx) => idx !== i))
  }

  const results = scenarios.map(s => analyzeDeal(s))

  const colWidth = scenarios.length === 3 ? "w-36" : "w-44"

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 mt-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-gray-900">Scenario Analysis</h2>
        {scenarios.length < MAX_SCENARIOS && (
          <button
            onClick={addScenario}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-50"
          >
            + Add Scenario
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-5">Changes here are for analysis only — nothing is saved to the deal.</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-y-0">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide pr-4 w-40 pb-3" />
              {scenarios.map((sc, i) => (
                <th key={i} className={`${colWidth} pb-3 px-2`}>
                  <div className="flex items-center gap-1 justify-between">
                    <input
                      value={sc.name}
                      onChange={e => updateScenario(i, "name", e.target.value)}
                      className="font-semibold text-sm text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none w-full"
                    />
                    {scenarios.length > 2 && (
                      <button onClick={() => removeScenario(i)} className="text-gray-300 hover:text-red-400 shrink-0 text-xs ml-1">✕</button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* INPUTS */}
            <SectionRow label="INPUTS" cols={scenarios.length} />

            <InputRow label="Purchase Price">
              {scenarios.map((sc, i) => (
                <NumInput key={i} prefix="$" value={sc.purchasePrice} step={1000} onChange={v => updateScenario(i, "purchasePrice", v)} />
              ))}
            </InputRow>

            <InputRow label="Down Payment">
              {scenarios.map((sc, i) => (
                <NumInput key={i} suffix="%" value={sc.downPaymentPct} step={1} onChange={v => updateScenario(i, "downPaymentPct", v)} />
              ))}
            </InputRow>

            <InputRow label="Interest Rate">
              {scenarios.map((sc, i) => (
                <NumInput key={i} suffix="%" value={sc.interestRate} step={0.125} onChange={v => updateScenario(i, "interestRate", v)} />
              ))}
            </InputRow>

            <InputRow label="Loan Term">
              {scenarios.map((sc, i) => (
                <td key={i} className={`${colWidth} py-1.5 px-2`}>
                  <select
                    value={sc.loanTermYears}
                    onChange={e => updateScenario(i, "loanTermYears", parseInt(e.target.value))}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    <option value={15}>15 yr</option>
                    <option value={20}>20 yr</option>
                    <option value={30}>30 yr</option>
                  </select>
                </td>
              ))}
            </InputRow>

            <InputRow label="Closing Costs">
              {scenarios.map((sc, i) => (
                <NumInput key={i} prefix="$" value={sc.closingCosts} step={500} onChange={v => updateScenario(i, "closingCosts", v)} />
              ))}
            </InputRow>

            <InputRow label="Rehab / Repairs">
              {scenarios.map((sc, i) => (
                <NumInput key={i} prefix="$" value={sc.rehabCosts} step={500} onChange={v => updateScenario(i, "rehabCosts", v)} />
              ))}
            </InputRow>

            <InputRow label="Monthly Rent">
              {scenarios.map((sc, i) => (
                <NumInput key={i} prefix="$" value={sc.monthlyRent} step={50} onChange={v => updateScenario(i, "monthlyRent", v)} />
              ))}
            </InputRow>

            <InputRow label="Vacancy Rate">
              {scenarios.map((sc, i) => (
                <NumInput key={i} suffix="%" value={sc.vacancyRate} step={1} onChange={v => updateScenario(i, "vacancyRate", v)} />
              ))}
            </InputRow>

            <InputRow label="Mgmt Fee">
              {scenarios.map((sc, i) => (
                <NumInput key={i} suffix="%" value={sc.managementFee} step={1} onChange={v => updateScenario(i, "managementFee", v)} />
              ))}
            </InputRow>

            <InputRow label="Annual Tax">
              {scenarios.map((sc, i) => (
                <NumInput key={i} prefix="$" value={sc.propertyTax} step={100} onChange={v => updateScenario(i, "propertyTax", v)} />
              ))}
            </InputRow>

            {/* OUTPUTS */}
            <SectionRow label="RESULTS" cols={scenarios.length} />

            <OutputRow label="Total Invested">
              {results.map((r, i) => (
                <td key={i} className={`${colWidth} py-2 px-2 text-right font-medium text-gray-800`}>{fmt(r.totalInvested)}</td>
              ))}
            </OutputRow>

            <OutputRow label="Monthly Mortgage">
              {results.map((r, i) => (
                <td key={i} className={`${colWidth} py-2 px-2 text-right font-medium text-gray-800`}>{fmt(r.monthlyMortgage)}</td>
              ))}
            </OutputRow>

            <OutputRow label="Monthly Cash Flow" highlight>
              {results.map((r, i) => (
                <td key={i} className={`${colWidth} py-2 px-2 text-right font-bold ${CASH_COLORS(r.monthlyCashFlow)}`}>{fmt(r.monthlyCashFlow)}</td>
              ))}
            </OutputRow>

            <OutputRow label="Annual Cash Flow">
              {results.map((r, i) => (
                <td key={i} className={`${colWidth} py-2 px-2 text-right font-medium ${r.annualCashFlow >= 0 ? "text-green-600" : "text-red-500"}`}>{fmt(r.annualCashFlow)}</td>
              ))}
            </OutputRow>

            <OutputRow label="Cap Rate" highlight>
              {results.map((r, i) => (
                <td key={i} className={`${colWidth} py-2 px-2 text-right font-bold ${PCT_COLORS(r.capRate, 6)}`}>{fmtPct(r.capRate)}</td>
              ))}
            </OutputRow>

            <OutputRow label="Cash-on-Cash" highlight>
              {results.map((r, i) => (
                <td key={i} className={`${colWidth} py-2 px-2 text-right font-bold ${PCT_COLORS(r.cashOnCash, 8)}`}>{fmtPct(r.cashOnCash)}</td>
              ))}
            </OutputRow>

            <OutputRow label="Gross Yield">
              {results.map((r, i) => (
                <td key={i} className={`${colWidth} py-2 px-2 text-right font-medium ${PCT_COLORS(r.grossYield, 8)}`}>{fmtPct(r.grossYield)}</td>
              ))}
            </OutputRow>

            <OutputRow label="DSCR">
              {results.map((r, i) => (
                <td key={i} className={`${colWidth} py-2 px-2 text-right font-medium ${PCT_COLORS(r.dscr === 999 ? 999 : r.dscr, 1.25)}`}>
                  {r.dscr === 999 ? "N/A" : r.dscr.toFixed(2) + "x"}
                </td>
              ))}
            </OutputRow>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SectionRow({ label, cols }: { label: string; cols: number }) {
  return (
    <tr>
      <td colSpan={cols + 1} className="pt-4 pb-1">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{label}</span>
      </td>
    </tr>
  )
}

function InputRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="text-xs text-gray-500 pr-4 py-1.5 whitespace-nowrap">{label}</td>
      {children}
    </tr>
  )
}

function OutputRow({ label, highlight, children }: { label: string; highlight?: boolean; children: React.ReactNode }) {
  return (
    <tr className={highlight ? "bg-gray-50" : ""}>
      <td className={`text-xs pr-4 py-2 whitespace-nowrap ${highlight ? "font-medium text-gray-700" : "text-gray-500"}`}>{label}</td>
      {children}
    </tr>
  )
}
