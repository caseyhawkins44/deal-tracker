import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import NavBar from "@/components/NavBar"
import { analyzeDeal, fmt, fmtPct } from "@/lib/calculations"
import { timeAgo } from "@/lib/timeAgo"
import { DEAL_STATUSES } from "@/lib/constants"

const STATUS_COLORS: Record<string, string> = {
  Prospecting: "bg-blue-50 text-blue-700 border-blue-200",
  "Under Analysis": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Offer Made": "bg-purple-50 text-purple-700 border-purple-200",
  Passed: "bg-gray-50 text-gray-600 border-gray-200",
}


export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  const [deals, recentActivity] = await Promise.all([
    prisma.deal.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        activity: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.activityLog.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        deal: { select: { id: true, name: true, address: true } },
      },
    }),
  ])

  const activeDeals = deals.filter((d) => d.status !== "Passed")
  const stagnant = activeDeals.filter((d) => {
    const lastActivity = d.activity[0]
    const reference = lastActivity ? lastActivity.createdAt : d.createdAt
    return reference < fourteenDaysAgo
  })

  // Average metrics across active deals
  let avgCapRate = 0
  let avgCashOnCash = 0
  if (activeDeals.length > 0) {
    const totals = activeDeals.reduce(
      (acc, d) => {
        const m = analyzeDeal(d)
        return { capRate: acc.capRate + m.capRate, cashOnCash: acc.cashOnCash + m.cashOnCash }
      },
      { capRate: 0, cashOnCash: 0 }
    )
    avgCapRate = totals.capRate / activeDeals.length
    avgCashOnCash = totals.cashOnCash / activeDeals.length
  }

  const statusCounts = DEAL_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = deals.filter((d) => d.status === s).length
    return acc
  }, {})

  return (
    <div className="min-h-screen">
      <NavBar user={session.user} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back, {session.user.name ?? session.user.email}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard label="Total Deals" value={String(deals.length)} sub="in pipeline" />
          <SummaryCard label="Active Deals" value={String(activeDeals.length)} sub="not passed" />
          <SummaryCard
            label="Avg Cap Rate"
            value={activeDeals.length ? fmtPct(avgCapRate) : "—"}
            sub="active deals"
          />
          <SummaryCard
            label="Avg Cash-on-Cash"
            value={activeDeals.length ? fmtPct(avgCashOnCash) : "—"}
            sub="active deals"
          />
        </div>

        {/* Status breakdown */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-4">Pipeline by Status</h2>
          <div className="flex flex-wrap gap-3">
            {DEAL_STATUSES.map((s) => (
              <Link
                key={s}
                href="/deals"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium ${STATUS_COLORS[s]}`}
              >
                {s}
                <span className="text-lg font-bold">{statusCounts[s]}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-semibold mb-4">Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-400">No activity yet. Add a deal to get started.</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((entry) => (
                  <div key={entry.id} className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 leading-snug">
                        <Link
                          href={`/deals/${entry.deal.id}`}
                          className="font-medium text-gray-900 hover:underline"
                        >
                          {entry.deal.name}
                        </Link>
                        {" — "}
                        {entry.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(entry.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deals Needing Attention */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="font-semibold mb-1">Needs Attention</h2>
            <p className="text-xs text-gray-400 mb-4">Active deals with no activity in 14+ days</p>
            {stagnant.length === 0 ? (
              <p className="text-sm text-gray-400">All deals have recent activity.</p>
            ) : (
              <div className="space-y-3">
                {stagnant.map((d) => {
                  const lastActivity = d.activity[0]
                  const reference = lastActivity ? lastActivity.createdAt : d.createdAt
                  const days = Math.floor(
                    (Date.now() - new Date(reference).getTime()) / (1000 * 60 * 60 * 24)
                  )
                  return (
                    <Link
                      key={d.id}
                      href={`/deals/${d.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50 hover:border-amber-300 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{d.name}</p>
                        <p className="text-xs text-gray-500">{d.status}</p>
                      </div>
                      <span className="text-xs text-amber-700 font-medium shrink-0 ml-2">
                        {days}d idle
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  )
}
