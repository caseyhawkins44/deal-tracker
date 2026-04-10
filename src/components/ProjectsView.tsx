"use client"

import { useState } from "react"
import Link from "next/link"
import { analyzeDeal, fmt, fmtPct } from "@/lib/calculations"

type Deal = {
  id: string
  name: string
  address: string
  city: string
  state: string
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
  addedBy: { name: string | null }
}

type Project = {
  id: string
  name: string
  deals: Deal[]
}

type Criteria = {
  minCashOnCash: number
  minCapRate: number
  minMonthlyCashFlow: number
}

export default function ProjectsView({
  initialProjects,
  initialUnassigned,
  criteria,
}: {
  initialProjects: Project[]
  initialUnassigned: Deal[]
  criteria: Criteria
}) {
  const [projects, setProjects] = useState(initialProjects)
  const [unassigned] = useState(initialUnassigned)
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  async function createProject() {
    if (!newName.trim()) return
    setCreating(true)
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    })
    setCreating(false)
    if (!res.ok) return
    const project = await res.json()
    setProjects(p => [...p, { ...project, deals: [] }])
    setNewName("")
  }

  async function renameProject(id: string) {
    if (!editName.trim()) return
    const res = await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    })
    if (!res.ok) return
    setProjects(p => p.map(proj => proj.id === id ? { ...proj, name: editName.trim() } : proj))
    setEditingId(null)
  }

  async function deleteProject(id: string) {
    if (!confirm("Delete this project? Deals will be unassigned but not deleted.")) return
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
    if (!res.ok) return
    setProjects(p => p.filter(proj => proj.id !== id))
  }

  function toggleCollapse(id: string) {
    setCollapsed(c => ({ ...c, [id]: !c[id] }))
  }

  const totalDeals = projects.reduce((sum, p) => sum + p.deals.length, 0) + unassigned.length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-gray-500 text-sm">{projects.length} project{projects.length !== 1 ? "s" : ""} · {totalDeals} deal{totalDeals !== 1 ? "s" : ""} total</p>
        </div>
        <Link
          href="/deals/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Add Deal
        </Link>
      </div>

      {/* New project input */}
      <div className="flex gap-2 mb-8">
        <input
          type="text"
          placeholder="New project name (e.g. Cleveland, Phoenix Metro)"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && createProject()}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={createProject}
          disabled={creating || !newName.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
        >
          {creating ? "Creating…" : "Create Project"}
        </button>
      </div>

      {/* Projects list */}
      <div className="space-y-4">
        {projects.map(project => (
          <div key={project.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {/* Project header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              {editingId === project.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    autoFocus
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") renameProject(project.id)
                      if (e.key === "Escape") setEditingId(null)
                    }}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={() => renameProject(project.id)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleCollapse(project.id)} className="flex items-center gap-2 group">
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                      className={`text-gray-400 transition-transform ${collapsed[project.id] ? "-rotate-90" : ""}`}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                    <span className="font-semibold text-gray-900 group-hover:text-blue-600">{project.name}</span>
                  </button>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {project.deals.length} deal{project.deals.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setEditingId(project.id); setEditName(project.name) }}
                  className="text-xs text-gray-400 hover:text-gray-700"
                >
                  Rename
                </button>
                <button
                  onClick={() => deleteProject(project.id)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Deals in project */}
            {!collapsed[project.id] && (
              project.deals.length === 0 ? (
                <div className="px-5 py-6 text-center text-sm text-gray-400">
                  No deals in this project yet. Assign deals to it when adding or editing a deal.
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {project.deals.map(deal => <DealRow key={deal.id} deal={deal} criteria={criteria} />)}
                </div>
              )
            )}
          </div>
        ))}

        {/* Unassigned deals */}
        {unassigned.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleCollapse("__unassigned")} className="flex items-center gap-2 group">
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                    className={`text-gray-400 transition-transform ${collapsed["__unassigned"] ? "-rotate-90" : ""}`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="font-semibold text-gray-500 group-hover:text-gray-700">Unassigned</span>
                </button>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {unassigned.length} deal{unassigned.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            {!collapsed["__unassigned"] && (
              <div className="divide-y divide-gray-50">
                {unassigned.map(deal => <DealRow key={deal.id} deal={deal} criteria={criteria} />)}
              </div>
            )}
          </div>
        )}

        {projects.length === 0 && unassigned.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-400 text-lg mb-2">No projects yet</p>
            <p className="text-gray-400 text-sm">Create a project above to group deals by area.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function DealRow({ deal, criteria }: { deal: Deal; criteria: Criteria }) {
  const m = analyzeDeal(deal)
  const positive = m.monthlyCashFlow >= 0
  const meetsCoC = m.cashOnCash >= criteria.minCashOnCash
  const meetsCap = m.capRate >= criteria.minCapRate
  const meetsCF = m.monthlyCashFlow >= criteria.minMonthlyCashFlow

  return (
    <Link href={`/deals/${deal.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{deal.name}</p>
        <p className="text-xs text-gray-400">{deal.city}, {deal.state} · {deal.status}</p>
      </div>
      <div className="flex items-center gap-6 shrink-0 ml-4">
        <Metric label="Price" value={fmt(deal.purchasePrice)} />
        <Metric label="Cash Flow/mo" value={fmt(m.monthlyCashFlow)} highlight={positive && meetsCF ? "green" : !positive ? "red" : undefined} />
        <Metric label="CoC" value={fmtPct(m.cashOnCash)} highlight={meetsCoC ? "green" : undefined} />
        <Metric label="Cap Rate" value={fmtPct(m.capRate)} highlight={meetsCap ? "green" : undefined} />
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gray-300">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: "green" | "red" }) {
  return (
    <div className="text-right hidden sm:block">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-sm font-medium ${highlight === "green" ? "text-green-600" : highlight === "red" ? "text-red-500" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  )
}
