"use client"

import { useState } from "react"
import { analyzeDeal, fmt, fmtPct, type Deal } from "@/lib/calculations"

type Scenario = Deal & { name: string }

const MAX_SCENARIOS = 3
const CLOSING_COST_PCT = 0.025

function makeScenario(base: Deal, name: string): Scenario {
  return { ...base, name }
}

const inputCls = "w-full border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"

function cashColor(v: number) {
  return v >= 200 ? "text-green-600" : v >= 0 ? "text-amber-600" : "text-red-500"
}
function pctColor(v: number, threshold: number) {
  return v >= threshold ? "text-green-600" : v >= threshold * 0.8 ? "text-amber-600" : "text-red-500"
}

export default function ScenarioAnalyzer({ deal }: { deal: Deal }) {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    makeScenario(deal, "Current Deal"),
    makeScenario(deal, "Scenario 2"),
  ])
  const [closingManual, setClosingManual] = useState<boolean[]>([false, false])

  function update(i: number, field: keyof Scenario, value: string | number) {
    setScenarios(s => s.map((sc, idx) => {
      if (idx !== i) return sc
      const updated = { ...sc, [field]: value }
      if (field === "purchasePrice" && !closingManual[i]) {
        updated.closingCosts = Math.round((value as number) * CLOSING_COST_PCT)
      }
      return updated
    }))
  }

  function updateClosing(i: number, value: number) {
    setClosingManual(m => m.map((v, idx) => idx === i ? true : v))
    setScenarios(s => s.map((sc, idx) => idx === i ? { ...sc, closingCosts: value } : sc))
  }

  function addScenario() {
    setScenarios(s => [...s, makeScenario(deal, `Scenario ${s.length + 1}`)])
    setClosingManual(m => [...m, false])
  }

  function removeScenario(i: number) {
    setScenarios(s => s.filter((_, idx) => idx !== i))
    setClosingManual(m => m.filter((_, idx) => idx !== i))
  }

  const results = scenarios.map(s => analyzeDeal(s))
  const n = scenarios.length

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 mt-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-gray-900">Scenario Analysis</h2>
        {n < MAX_SCENARIOS && (
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
        <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "140px" }} />
            {scenarios.map((_, i) => <col key={i} />)}
          </colgroup>

          <thead>
            <tr>
              <th />
              {scenarios.map((sc, i) => (
                <th key={i} className="px-2 pb-3 text-left">
                  <div className="flex items-center gap-1">
                    <input
                      value={sc.name}
                      onChange={e => update(i, "name", e.target.value)}
                      className="font-semibold text-sm text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-400 focus:outline-none w-full min-w-0"
                    />
                    {n > 2 && (
                      <button onClick={() => removeScenario(i)} className="text-gray-300 hover:text-red-400 shrink-0 text-xs">✕</button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <SectionLabel label="INPUTS" cols={n} />

            <Row label="Purchase Price">
              {scenarios.map((sc, i) => (
                <td key={i} className="px-2 py-1.5">
                  <div className="flex items-center gap-0.5">
                    <span className="text-xs text-gray-400 shrink-0">$</span>
                    <input type="number" min={0} step={1000} value={sc.purchasePrice}
                      onChange={e => update(i, "purchasePrice", parseFloat(e.target.value) || 0)}
                      className={inputCls} />
                  </div>
                </td>
              ))}
            </Row>

            <Row label="Down Payment">
              {scenarios.map((sc, i) => (
                <td key={i} className="px-2 py-1.5">
                  <div className="flex items-center gap-0.5">
                    <input type="number" min={0} max={100} step={1} value={sc.downPaymentPct}
                      onChange={e => update(i, "downPaymentPct", parseFloat(e.target.value) || 0)}
                      className={inputCls} />
                    <span className="text-xs text-gray-400 shrink-0">%</span>
                  </div>
                </td>
              ))}
            </Row>

            <Row label="Interest Rate">
              {scenarios.map((sc, i) => (
                <td key={i} className="px-2 py-1.5">
                  <div className="flex items-center gap-0.5">
                    <input type="number" min={0} max={30} step={0.125} value={sc.interestRate}
                      onChange={e => update(i, "interestRate", parseFloat(e.target.value) || 0)}
                      className={inputCls} />
                    <span className="text-xs text-gray-400 shrink-0">%</span>
                  </div>
                </td>
              ))}
            </Row>

            <Row label="Loan Term">
              {scenarios.map((sc, i) => (
                <td key={i} className="px-2 py-1.5">
                  <select value={sc.loanTermYears}
                    onChange={e => update(i, "loanTermYears", parseInt(e.target.value))}
                    className={inputCls}>
                    <option value={15}>15 yr</option>
                    <option value={20}>20 yr</option>
                    <option value={30}>30 yr</option>
                  </select>
                </td>
              ))}
            </Row>

            <Row label="Closing Costs">
              {scenarios.map((sc, i) => (
                <td key={i} className="px-2 py-1.5">
                  <div className="flex items-center gap-0.5">
                    <span className="text-xs text-gray-400 shrink-0">$</span>
                    <input type="number" min={0} step={500} value={sc.closingCosts}
                      onChange={e => updateClosing(i, parseFloat(e.target.value) || 0)}
                      className={inputCls} />
                  </div>
                  {!closingManual[i] && sc.purchasePrice > 0 && (
                    <p className="text-[10px] text-blue-400 text-right mt-0.5">est. 2.5%</p>
                  )}
                </td>
              ))}
            </Row>

            <Row label="Rehab / Repairs">
              {scenarios.map((sc, i) => (
                <td key={i} className="px-2 py-1.5">
                  <div className="flex items-center gap-0.5">
                    <span className="text-xs text-gray-400 shrink-0">$</span>
                    <input type="number" min={0} step={500} value={sc.rehabCosts}
                      onChange={e => update(i, "rehabCosts", parseFloat(e.target.value) || 0)}
                      className={inputCls} />
                  </div>
                </td>
              ))}
            </Row>

            <Row label="Monthly Rent">
              {scenarios.map((sc, i) => (
                <td key={i} className="px-2 py-1.5">
                  <div className="flex items-center gap-0.5">
                    <span className="text-xs text-gray-400 shrink-0">$</span>
                    <input type="number" min={0} step={50} value={sc.monthlyRent}
                      onChange={e => update(i, "monthlyRent", parseFloat(e.target.value) || 0)}
                      className={inputCls} />
                  </div>
                </td>
              ))}
            </Row>

            <Row label="Vacancy Rate">
              {scenarios.map((sc, i) => (
                <td key={i} className="px-2 py-1.5">
                  <div className="flex items-center gap-0.5">
                    <input type="number" min={0} max={100} step={1} value={sc.vacancyRate}
                      onChange={e => update(i, "vacancyRate", parseFloat(e.target.value) || 0)}
                      className={inputCls} />
                    <span className="text-xs text-gray-400 shrink-0">%</span>
                  </div>
                </td>
              ))}
            </Row>

            <Row label="Mgmt Fee">
              {scenarios.map((sc, i) => (
                <td key={i} className="px-2 py-1.5">
                  <div className="flex items-center gap-0.5">
                    <input type="number" min={0} max={30} step={1} value={sc.managementFee}
                      onChange={e => update(i, "managementFee", parseFloat(e.target.value) || 0)}
                      className={inputCls} />
                    <span className="text-xs text-gray-400 shrink-0">%</span>
                  </div>
                </td>
              ))}
            </Row>

            <Row label="Insurance /mo">
              {scenarios.map((sc, i) => (
                <td key={i} className="px-2 py-1.5">
                  <div className="flex items-center gap-0.5">
                    <span className="text-xs text-gray-400 shrink-0">$</span>
                    <input type="number" min={0} step={25} value={sc.insurance}
                      onChange={e => update(i, "insurance", parseFloat(e.target.value) || 0)}
                      className={inputCls} />
                  </div>
                </td>
              ))}
            </Row>

            <SectionLabel label="RESULTS" cols={n} />

            <ResultRow label="Total Invested" highlight={false}>
              {results.map((r, i) => (
                <td key={i} className="px-2 py-2 text-right font-medium text-gray-800">{fmt(r.totalInvested)}</td>
              ))}
            </ResultRow>

            <ResultRow label="Monthly Mortgage" highlight={false}>
              {results.map((r, i) => (
                <td key={i} className="px-2 py-2 text-right font-medium text-gray-700">{fmt(r.monthlyMortgage)}</td>
              ))}
            </ResultRow>

            <ResultRow label="Monthly Cash Flow" highlight>
              {results.map((r, i) => (
                <td key={i} className={`px-2 py-2 text-right font-bold ${cashColor(r.monthlyCashFlow)}`}>{fmt(r.monthlyCashFlow)}</td>
              ))}
            </ResultRow>

            <ResultRow label="Annual Cash Flow" highlight={false}>
              {results.map((r, i) => (
                <td key={i} className={`px-2 py-2 text-right font-medium ${r.annualCashFlow >= 0 ? "text-green-600" : "text-red-500"}`}>{fmt(r.annualCashFlow)}</td>
              ))}
            </ResultRow>

            <ResultRow label="Cap Rate" highlight>
              {results.map((r, i) => (
                <td key={i} className={`px-2 py-2 text-right font-bold ${pctColor(r.capRate, 6)}`}>{fmtPct(r.capRate)}</td>
              ))}
            </ResultRow>

            <ResultRow label="Cash-on-Cash" highlight>
              {results.map((r, i) => (
                <td key={i} className={`px-2 py-2 text-right font-bold ${pctColor(r.cashOnCash, 8)}`}>{fmtPct(r.cashOnCash)}</td>
              ))}
            </ResultRow>

            <ResultRow label="Gross Yield" highlight={false}>
              {results.map((r, i) => (
                <td key={i} className={`px-2 py-2 text-right font-medium ${pctColor(r.grossYield, 8)}`}>{fmtPct(r.grossYield)}</td>
              ))}
            </ResultRow>

            <ResultRow label="DSCR" highlight={false}>
              {results.map((r, i) => (
                <td key={i} className={`px-2 py-2 text-right font-medium ${pctColor(r.dscr === 999 ? 999 : r.dscr, 1.25)}`}>
                  {r.dscr === 999 ? "N/A" : r.dscr.toFixed(2) + "x"}
                </td>
              ))}
            </ResultRow>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SectionLabel({ label, cols }: { label: string; cols: number }) {
  return (
    <tr>
      <td colSpan={cols + 1} className="pt-5 pb-1.5 border-t border-gray-100">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{label}</span>
      </td>
    </tr>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="hover:bg-gray-50/60">
      <td className="text-xs text-gray-500 py-1.5 pr-2 whitespace-nowrap">{label}</td>
      {children}
    </tr>
  )
}

function ResultRow({ label, highlight, children }: { label: string; highlight: boolean; children: React.ReactNode }) {
  return (
    <tr className={highlight ? "bg-gray-50" : ""}>
      <td className={`text-xs py-2 pr-2 whitespace-nowrap ${highlight ? "font-medium text-gray-700" : "text-gray-500"}`}>{label}</td>
      {children}
    </tr>
  )
}
