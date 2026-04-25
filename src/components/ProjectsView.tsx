"use client"

import { useState } from "react"
import Link from "next/link"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
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
  capexReserve: number
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
  const [unassigned, setUnassigned] = useState(initialUnassigned)
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function findDeal(dealId: string): Deal | null {
    for (const p of projects) {
      const d = p.deals.find(d => d.id === dealId)
      if (d) return d
    }
    return unassigned.find(d => d.id === dealId) ?? null
  }

  function findCurrentContainer(dealId: string): string {
    for (const p of projects) {
      if (p.deals.some(d => d.id === dealId)) return p.id
    }
    return "__unassigned"
  }

  function handleDragStart(event: DragStartEvent) {
    const deal = findDeal(event.active.id as string)
    setActiveDeal(deal)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null)
    const dealId = event.active.id as string
    const targetContainer = event.over?.id as string | undefined
    if (!targetContainer) return

    const currentContainer = findCurrentContainer(dealId)
    if (currentContainer === targetContainer) return

    const deal = findDeal(dealId)!
    const newProjectId = targetContainer === "__unassigned" ? null : targetContainer

    // Optimistic update
    setProjects(prev =>
      prev.map(p => ({
        ...p,
        deals: p.id === currentContainer
          ? p.deals.filter(d => d.id !== dealId)
          : p.id === targetContainer
          ? [...p.deals, deal]
          : p.deals,
      }))
    )
    setUnassigned(prev =>
      targetContainer === "__unassigned"
        ? [...prev, deal]
        : currentContainer === "__unassigned"
        ? prev.filter(d => d.id !== dealId)
        : prev
    )

    // Persist
    await fetch(`/api/deals/${dealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: newProjectId }),
    })
  }

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
    const freed = projects.find(p => p.id === id)?.deals ?? []
    setProjects(p => p.filter(proj => proj.id !== id))
    setUnassigned(prev => [...prev, ...freed])
  }

  function toggleCollapse(id: string) {
    setCollapsed(c => ({ ...c, [id]: !c[id] }))
  }

  const totalDeals = projects.reduce((sum, p) => sum + p.deals.length, 0) + unassigned.length

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-gray-500 text-sm">
              {projects.length} project{projects.length !== 1 ? "s" : ""} · {totalDeals} deal{totalDeals !== 1 ? "s" : ""} total
            </p>
          </div>
          <Link href="/deals/new" className="bg-[#0071e3] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#0065d1]">
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
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40"
          />
          <button
            onClick={createProject}
            disabled={creating || !newName.trim()}
            className="bg-[#0071e3] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#0065d1] disabled:opacity-40"
          >
            {creating ? "Creating…" : "Create Project"}
          </button>
        </div>

        {/* Projects */}
        <div className="space-y-4">
          {projects.map(project => (
            <ProjectBucket
              key={project.id}
              project={project}
              criteria={criteria}
              collapsed={!!collapsed[project.id]}
              onToggle={() => toggleCollapse(project.id)}
              editing={editingId === project.id}
              editName={editName}
              onEditStart={() => { setEditingId(project.id); setEditName(project.name) }}
              onEditChange={setEditName}
              onEditSave={() => renameProject(project.id)}
              onEditCancel={() => setEditingId(null)}
              onDelete={() => deleteProject(project.id)}
            />
          ))}

          {/* Unassigned */}
          {(unassigned.length > 0 || projects.length > 0) && (
            <UnassignedBucket
              deals={unassigned}
              criteria={criteria}
              collapsed={!!collapsed["__unassigned"]}
              onToggle={() => toggleCollapse("__unassigned")}
            />
          )}

          {projects.length === 0 && unassigned.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[18px] border border-black/[0.07] shadow-sm">
              <p className="text-gray-400 text-lg mb-2">No projects yet</p>
              <p className="text-gray-400 text-sm">Create a project above to group deals by area.</p>
            </div>
          )}
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeDeal && <DealRowOverlay deal={activeDeal} criteria={criteria} />}
      </DragOverlay>
    </DndContext>
  )
}

function ProjectBucket({
  project, criteria, collapsed, onToggle,
  editing, editName, onEditStart, onEditChange, onEditSave, onEditCancel, onDelete,
}: {
  project: Project
  criteria: Criteria
  collapsed: boolean
  onToggle: () => void
  editing: boolean
  editName: string
  onEditStart: () => void
  onEditChange: (v: string) => void
  onEditSave: () => void
  onEditCancel: () => void
  onDelete: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: project.id })

  return (
    <div
      ref={setNodeRef}
      className={`bg-white border rounded-[18px] overflow-hidden transition-all shadow-sm ${isOver ? "border-[#0071e3]/50 ring-2 ring-[#0071e3]/10" : "border-black/[0.07]"}`}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        {editing ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              autoFocus
              type="text"
              value={editName}
              onChange={e => onEditChange(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") onEditSave(); if (e.key === "Escape") onEditCancel() }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40"
            />
            <button onClick={onEditSave} className="text-sm text-[#0071e3] hover:text-[#0065d1] font-medium">Save</button>
            <button onClick={onEditCancel} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={onToggle} className="flex items-center gap-2 group">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                className={`text-gray-400 transition-transform ${collapsed ? "-rotate-90" : ""}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
              <span className="font-semibold text-gray-900 group-hover:text-[#0071e3]">{project.name}</span>
            </button>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {project.deals.length} deal{project.deals.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <button onClick={onEditStart} className="text-xs text-gray-400 hover:text-gray-700">Rename</button>
          <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-600">Delete</button>
        </div>
      </div>

      {!collapsed && (
        project.deals.length === 0 ? (
          <div className={`px-5 py-6 text-center text-sm transition-colors ${isOver ? "text-[#0071e3]/70" : "text-gray-400"}`}>
            {isOver ? "Drop here to add to this project" : "Drag deals here, or assign via the deal form."}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {project.deals.map(deal => <DraggableDealRow key={deal.id} deal={deal} criteria={criteria} />)}
            {isOver && (
              <div className="px-5 py-3 text-center text-xs text-[#0071e3] bg-[#e8f1fb]">Drop to add here</div>
            )}
          </div>
        )
      )}
    </div>
  )
}

function UnassignedBucket({
  deals, criteria, collapsed, onToggle,
}: {
  deals: Deal[]
  criteria: Criteria
  collapsed: boolean
  onToggle: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "__unassigned" })

  return (
    <div
      ref={setNodeRef}
      className={`bg-white border rounded-[18px] overflow-hidden transition-all shadow-sm ${isOver ? "border-black/[0.20] ring-2 ring-black/[0.04]" : "border-black/[0.07]"}`}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={onToggle} className="flex items-center gap-2 group">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
              className={`text-gray-400 transition-transform ${collapsed ? "-rotate-90" : ""}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            <span className="font-semibold text-gray-500 group-hover:text-gray-700">Unassigned</span>
          </button>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {deals.length} deal{deals.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      {!collapsed && (
        deals.length === 0 ? (
          <div className={`px-5 py-6 text-center text-sm transition-colors ${isOver ? "text-gray-500" : "text-gray-400"}`}>
            {isOver ? "Drop here to unassign" : "No unassigned deals."}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {deals.map(deal => <DraggableDealRow key={deal.id} deal={deal} criteria={criteria} />)}
          </div>
        )
      )}
    </div>
  )
}

function DraggableDealRow({ deal, criteria }: { deal: Deal; criteria: Criteria }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id })

  return (
    <div ref={setNodeRef} className={isDragging ? "opacity-40" : ""}>
      <div className="flex items-center group">
        {/* Drag handle */}
        <div
          {...listeners}
          {...attributes}
          className="pl-3 pr-1 py-3.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none"
          title="Drag to move"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
            <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
            <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
          </svg>
        </div>
        <DealRowContent deal={deal} criteria={criteria} />
      </div>
    </div>
  )
}

function DealRowOverlay({ deal, criteria }: { deal: Deal; criteria: Criteria }) {
  return (
    <div className="bg-white border border-[#0071e3]/40 rounded-xl shadow-lg opacity-95 flex items-center">
      <div className="pl-3 pr-1 py-3.5 text-[#0071e3]/70">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
        </svg>
      </div>
      <DealRowContent deal={deal} criteria={criteria} />
    </div>
  )
}

function DealRowContent({ deal, criteria }: { deal: Deal; criteria: Criteria }) {
  const m = analyzeDeal(deal)
  const positive = m.monthlyCashFlow >= 0
  const meetsCoC = m.cashOnCash >= criteria.minCashOnCash
  const meetsCap = m.capRate >= criteria.minCapRate
  const meetsCF = m.monthlyCashFlow >= criteria.minMonthlyCashFlow

  return (
    <Link href={`/deals/${deal.id}`} className="flex flex-1 items-center justify-between px-4 py-3.5 hover:bg-black/[0.02] transition-colors min-w-0">
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
