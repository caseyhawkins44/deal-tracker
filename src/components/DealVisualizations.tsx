"use client"

import { useState, useEffect } from "react"
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  ComposedChart, BarChart, Bar, Line,
} from "recharts"
import { analyzeDeal, fmt, fmtPct, type Deal } from "@/lib/calculations"

type Tab = "waterfall" | "donut" | "amortization" | "projection" | "breakeven"

const TABS: { key: Tab; label: string }[] = [
  { key: "waterfall", label: "Expense Waterfall" },
  { key: "donut", label: "Rent Breakdown" },
  { key: "amortization", label: "Amortization" },
  { key: "projection", label: "10-Year Projection" },
  { key: "breakeven", label: "Break-Even" },
]

export default function DealVisualizations({ deal }: { deal: Deal }) {
  const [tab, setTab] = useState<Tab>("waterfall")
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const m = analyzeDeal(deal)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 mt-6">
      <h2 className="font-semibold mb-4">Visualizations</h2>

      <div className="flex gap-0 mb-6 border-b border-gray-200 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              tab === t.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!mounted ? (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
      ) : tab === "waterfall" ? (
        <ExpenseWaterfall deal={deal} m={m} />
      ) : tab === "donut" ? (
        <RentDonut deal={deal} m={m} />
      ) : tab === "amortization" ? (
        <AmortizationCurve deal={deal} m={m} />
      ) : tab === "projection" ? (
        <TenYearProjection deal={deal} m={m} />
      ) : (
        <BreakEvenGauge deal={deal} m={m} />
      )}
    </div>
  )
}

// ─── Expense Waterfall ───────────────────────────────────────────────────────

type M = ReturnType<typeof analyzeDeal>

type WaterfallEntry = {
  name: string
  base: number
  value: number
  type: "start" | "expense" | "result"
  raw: number // signed amount for tooltip
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function WaterfallTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const entry: WaterfallEntry = payload[0]?.payload
  if (!entry) return null
  const isExpense = entry.type === "expense"
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-gray-800 mb-0.5">{entry.name}</p>
      <p className={isExpense ? "text-red-500" : entry.raw >= 0 ? "text-green-600" : "text-red-500"}>
        {isExpense ? "−" : ""}
        {fmt(Math.abs(entry.raw))}
      </p>
    </div>
  )
}

function ExpenseWaterfall({ deal, m }: { deal: Deal; m: M }) {
  const grossRent = deal.monthlyRent
  if (grossRent === 0) {
    return <p className="text-sm text-gray-400">No monthly rent entered.</p>
  }

  const propTax = deal.propertyTax / 12
  const mgmtFee = m.effectiveRent * (deal.managementFee / 100)
  const vacancyLoss = grossRent * (deal.vacancyRate / 100)

  let running = grossRent
  const data: WaterfallEntry[] = []

  data.push({ name: "Gross Rent", base: 0, value: grossRent, type: "start", raw: grossRent })

  const addExpense = (name: string, amount: number) => {
    if (amount <= 0) return
    running -= amount
    data.push({ name, base: Math.max(0, running), value: amount, type: "expense", raw: -amount })
  }

  if (vacancyLoss > 0) addExpense(`Vacancy ${deal.vacancyRate}%`, vacancyLoss)
  if (propTax > 0) addExpense("Property Tax", propTax)
  if (deal.insurance > 0) addExpense("Insurance", deal.insurance)
  if (deal.maintenance > 0) addExpense("Maintenance", deal.maintenance)
  if (deal.utilities > 0) addExpense("Utilities", deal.utilities)
  if (deal.hoaFees > 0) addExpense("HOA Fees", deal.hoaFees)
  if (mgmtFee > 0) addExpense(`Mgmt Fee ${deal.managementFee}%`, mgmtFee)
  addExpense("Mortgage P&I", m.monthlyMortgage)

  const cf = m.monthlyCashFlow
  data.push({ name: "Net Cash Flow", base: 0, value: Math.abs(cf), type: "result", raw: cf })

  const barColors = data.map((d) =>
    d.type === "start"
      ? "#22c55e"
      : d.type === "expense"
      ? "#f87171"
      : d.raw >= 0
      ? "#16a34a"
      : "#ef4444"
  )

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 16, right: 16, left: 8, bottom: 56 }} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: "#6b7280" }}
          tickLine={false}
          axisLine={false}
          angle={-40}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          tickFormatter={(v: number) => `$${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<WaterfallTooltip />} cursor={{ fill: "#f9fafb" }} />
        {/* Transparent base creates the "floating" waterfall effect */}
        <Bar dataKey="base" stackId="wf" fill="transparent" isAnimationActive={false} />
        <Bar dataKey="value" stackId="wf" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {data.map((_, i) => (
            <Cell key={i} fill={barColors[i]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Rent Breakdown Donut ────────────────────────────────────────────────────

const DONUT_COLORS: Record<string, string> = {
  Vacancy: "#94a3b8",
  "Property Tax": "#f97316",
  Insurance: "#a78bfa",
  Maintenance: "#60a5fa",
  Utilities: "#34d399",
  "HOA Fees": "#f59e0b",
  "Mgmt Fee": "#ec4899",
  Mortgage: "#6366f1",
  "Net Cash Flow": "#22c55e",
}

function RentDonut({ deal, m }: { deal: Deal; m: M }) {
  if (deal.monthlyRent === 0) {
    return <p className="text-sm text-gray-400">No monthly rent entered.</p>
  }

  const propTax = deal.propertyTax / 12
  const mgmtFee = m.effectiveRent * (deal.managementFee / 100)
  const vacancyLoss = deal.monthlyRent * (deal.vacancyRate / 100)

  const segments = [
    { name: "Vacancy", value: vacancyLoss },
    { name: "Property Tax", value: propTax },
    { name: "Insurance", value: deal.insurance },
    { name: "Maintenance", value: deal.maintenance },
    { name: "Utilities", value: deal.utilities },
    { name: "HOA Fees", value: deal.hoaFees },
    { name: "Mgmt Fee", value: mgmtFee },
    { name: "Mortgage", value: m.monthlyMortgage },
    { name: "Net Cash Flow", value: Math.max(0, m.monthlyCashFlow) },
  ].filter((s) => s.value > 0)

  return (
    <div className="flex flex-col md:flex-row items-center gap-8">
      <div className="w-full md:w-64 h-64 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={100}
              paddingAngle={2}
            >
              {segments.map((entry, i) => (
                <Cell key={i} fill={DONUT_COLORS[entry.name] ?? "#9ca3af"} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [fmt(Number(value ?? 0)), ""]}
              contentStyle={{ fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2">
        {segments.map((s) => (
          <div key={s.name} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: DONUT_COLORS[s.name] ?? "#9ca3af" }}
            />
            <span className="text-gray-600 w-28">{s.name}</span>
            <span className="font-medium text-gray-900 w-20 text-right">{fmt(s.value)}</span>
            <span className="text-gray-400 text-xs">
              {((s.value / deal.monthlyRent) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
        {m.monthlyCashFlow < 0 && (
          <p className="text-xs text-red-500 mt-2">
            Negative cash flow — expenses exceed rent by {fmt(Math.abs(m.monthlyCashFlow))}/mo
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Amortization Curve ──────────────────────────────────────────────────────

function AmortizationCurve({ deal, m }: { deal: Deal; m: M }) {
  if (m.loanAmount === 0) {
    return <p className="text-sm text-gray-400">No loan — property assumed to be purchased in cash.</p>
  }

  const monthlyRate = deal.interestRate / 100 / 12
  let balance = m.loanAmount
  let totalInterest = 0

  const data: { year: number; balance: number; principalPaid: number; interestPaid: number }[] = []

  for (let year = 1; year <= deal.loanTermYears; year++) {
    for (let mo = 0; mo < 12; mo++) {
      const interest = balance * monthlyRate
      totalInterest += interest
      balance = Math.max(0, balance - (m.monthlyMortgage - interest))
    }
    data.push({
      year,
      balance: Math.round(balance),
      principalPaid: Math.round(m.loanAmount - balance),
      interestPaid: Math.round(totalInterest),
    })
    if (balance === 0) break
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="year"
            tickLine={false}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            label={{ value: "Year", position: "insideBottomRight", offset: -4, fontSize: 11, fill: "#9ca3af" }}
          />
          <YAxis
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value, name) => [fmt(Number(value ?? 0)), String(name ?? "")]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Area
            type="monotone"
            dataKey="balance"
            name="Remaining Balance"
            stroke="#6366f1"
            fill="#e0e7ff"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="principalPaid"
            name="Equity (Paydown)"
            stroke="#22c55e"
            fill="#dcfce7"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="interestPaid"
            name="Cumulative Interest Paid"
            stroke="#f97316"
            fill="#ffedd5"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-400 mt-2 text-center">
        Total interest over {deal.loanTermYears} years:{" "}
        {fmt(data[data.length - 1]?.interestPaid ?? 0)}
      </p>
    </div>
  )
}

// ─── 10-Year Projection ──────────────────────────────────────────────────────

function TenYearProjection({ deal, m }: { deal: Deal; m: M }) {
  const [rentGrowth, setRentGrowth] = useState(2)
  const [appreciation, setAppreciation] = useState(3)

  const monthlyRate = deal.interestRate / 100 / 12

  // Pre-compute amortization balances by year end
  const balanceByYear: number[] = []
  let loanBalance = m.loanAmount
  for (let y = 0; y < 10; y++) {
    for (let mo = 0; mo < 12; mo++) {
      const interest = loanBalance * monthlyRate
      loanBalance = Math.max(0, loanBalance - (m.monthlyMortgage - interest))
    }
    balanceByYear.push(loanBalance)
  }

  let cumulativeCashFlow = 0
  const data = Array.from({ length: 10 }, (_, i) => {
    const year = i + 1
    const adjustedRent = deal.monthlyRent * Math.pow(1 + rentGrowth / 100, i)
    const yearM = analyzeDeal({ ...deal, monthlyRent: adjustedRent })
    cumulativeCashFlow += yearM.annualCashFlow
    const propertyValue = deal.purchasePrice * Math.pow(1 + appreciation / 100, year)
    const equity = propertyValue - balanceByYear[i]

    return {
      year: `Yr ${year}`,
      annualCashFlow: Math.round(yearM.annualCashFlow),
      cumulativeCashFlow: Math.round(cumulativeCashFlow),
      equity: Math.round(equity),
    }
  })

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Rent growth/yr</span>
          <input
            type="number"
            value={rentGrowth}
            onChange={(e) => setRentGrowth(Number(e.target.value))}
            className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            step={0.5}
            min={0}
            max={20}
          />
          <span className="text-gray-500">%</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Appreciation/yr</span>
          <input
            type="number"
            value={appreciation}
            onChange={(e) => setAppreciation(Number(e.target.value))}
            className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            step={0.5}
            min={0}
            max={20}
          />
          <span className="text-gray-500">%</span>
        </label>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} />
          <YAxis
            tickFormatter={(v: number) =>
              Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
            }
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value, name) => [fmt(Number(value ?? 0)), String(name ?? "")]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="annualCashFlow" name="Annual Cash Flow" fill="#60a5fa" opacity={0.75} />
          <Line
            type="monotone"
            dataKey="cumulativeCashFlow"
            name="Cumulative Cash Flow"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="equity"
            name="Total Equity"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-400 mt-2 text-center">
        Equity includes loan paydown + appreciation. Expenses fixed; mortgage payment fixed.
      </p>
    </div>
  )
}

// ─── Break-Even Gauge ────────────────────────────────────────────────────────

function BreakEvenGauge({ deal, m }: { deal: Deal; m: M }) {
  if (deal.monthlyRent === 0) {
    return <p className="text-sm text-gray-400">No monthly rent entered.</p>
  }

  const fixedExpenses =
    deal.propertyTax / 12 +
    deal.insurance +
    deal.maintenance +
    deal.utilities +
    deal.hoaFees

  // At break-even: monthlyRent*(1-v/100)*(1-mgmt/100) - fixedExpenses - mortgage = 0
  // v = (1 - needed / (monthlyRent * (1-mgmt/100))) * 100
  const mgmtFactor = 1 - deal.managementFee / 100
  const needed = fixedExpenses + m.monthlyMortgage
  const denominator = deal.monthlyRent * mgmtFactor

  let breakEven = denominator > 0 ? (1 - needed / denominator) * 100 : -Infinity

  const currentVacancy = deal.vacancyRate
  const isSafe = currentVacancy < breakEven
  const buffer = breakEven - currentVacancy

  // SVG semicircle gauge
  const CX = 130
  const CY = 115
  const R = 95
  const STROKE = 20

  function toPoint(pct: number, radius = R) {
    const angle = Math.PI - (Math.max(0, Math.min(100, pct)) / 100) * Math.PI
    return {
      x: CX + radius * Math.cos(angle),
      y: CY - radius * Math.sin(angle),
    }
  }

  function arcPath(fromPct: number, toPct: number) {
    const p1 = toPoint(fromPct)
    const p2 = toPoint(toPct)
    return `M ${p1.x} ${p1.y} A ${R} ${R} 0 0 1 ${p2.x} ${p2.y}`
  }

  const needlePt = toPoint(currentVacancy, R - 8)
  const breakPt = toPoint(Math.max(0, Math.min(100, breakEven)))

  const clampedBreak = Math.max(0, Math.min(100, breakEven))

  return (
    <div className="flex flex-col items-center">
      <svg width={260} height={135} viewBox="0 0 260 135">
        {/* Background */}
        <path
          d={arcPath(0, 100)}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={STROKE}
          strokeLinecap="butt"
        />

        {/* Green zone: 0 → break-even */}
        {breakEven > 0 && (
          <path
            d={arcPath(0, clampedBreak)}
            fill="none"
            stroke="#4ade80"
            strokeWidth={STROKE}
            strokeLinecap="butt"
          />
        )}

        {/* Red zone: break-even → 100 */}
        {breakEven < 100 && (
          <path
            d={arcPath(clampedBreak, 100)}
            fill="none"
            stroke="#f87171"
            strokeWidth={STROKE}
            strokeLinecap="butt"
          />
        )}

        {/* Break-even tick mark */}
        {breakEven > 0 && breakEven < 100 && (
          <>
            <line
              x1={breakPt.x}
              y1={breakPt.y}
              x2={CX + (R + 6) * Math.cos(Math.PI - (clampedBreak / 100) * Math.PI)}
              y2={CY - (R + 6) * Math.sin(Math.PI - (clampedBreak / 100) * Math.PI)}
              stroke="#1e293b"
              strokeWidth={2}
            />
          </>
        )}

        {/* Needle */}
        <line
          x1={CX}
          y1={CY}
          x2={needlePt.x}
          y2={needlePt.y}
          stroke="#1e293b"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle cx={CX} cy={CY} r={5} fill="#1e293b" />

        {/* Axis labels */}
        <text x={20} y={128} fontSize={10} fill="#9ca3af">0%</text>
        <text x={CX} y={18} fontSize={10} fill="#9ca3af" textAnchor="middle">50%</text>
        <text x={240} y={128} fontSize={10} fill="#9ca3af" textAnchor="end">100%</text>

        {/* Current vacancy label */}
        <text x={CX} y={CY + 22} fontSize={11} fill="#374151" textAnchor="middle" fontWeight="500">
          {currentVacancy}% vacancy
        </text>
      </svg>

      <div className="text-center mt-1">
        {breakEven <= 0 ? (
          <>
            <p className="text-xl font-bold text-red-500">No break-even</p>
            <p className="text-sm text-gray-500 mt-1">Property loses money even at 0% vacancy.</p>
          </>
        ) : breakEven >= 100 ? (
          <>
            <p className="text-xl font-bold text-green-600">Always profitable</p>
            <p className="text-sm text-gray-500 mt-1">Cash-flow positive even at 100% vacancy.</p>
          </>
        ) : (
          <>
            <p className="text-2xl font-bold">{fmtPct(breakEven)}</p>
            <p className="text-sm text-gray-500 mt-0.5">Break-even vacancy rate</p>
            <p className={`text-sm font-medium mt-2 ${isSafe ? "text-green-600" : "text-red-500"}`}>
              {isSafe
                ? `${buffer.toFixed(1)}% safety buffer above your ${currentVacancy}% assumption`
                : `Current vacancy (${currentVacancy}%) exceeds break-even — cash-flow negative`}
            </p>
          </>
        )}
      </div>

      <div className="flex gap-6 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-400 shrink-0" /> Profitable
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400 shrink-0" /> Loss zone
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-gray-800 shrink-0" /> Current vacancy
        </span>
      </div>
    </div>
  )
}
