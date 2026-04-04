"use client"

import { useState, useEffect, useCallback } from "react"

type ActivityEntry = {
  id: string
  action: string
  description: string
  createdAt: string
  user: { name: string | null; email: string | null }
}

const ACTION_ICONS: Record<string, string> = {
  DEAL_CREATED: "✦",
  STATUS_CHANGED: "⇄",
  FINANCIALS_EDITED: "✎",
  COMMENT_ADDED: "💬",
  VOTE_CAST: "✓",
  VOTE_CHANGED: "↺",
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

export default function DealActivity({ dealId }: { dealId: string }) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/deals/${dealId}/activity`)
    if (res.ok) setEntries(await res.json())
    setLoading(false)
  }, [dealId])

  useEffect(() => {
    if (open && entries.length === 0) load()
  }, [open, entries.length, load])

  return (
    <div className="bg-white border border-gray-200 rounded-2xl mt-6 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900">Timeline</span>
        <span className="text-gray-400 text-sm">{open ? "▲ Collapse" : "▼ Expand"}</span>
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-gray-100">
          {loading ? (
            <p className="text-sm text-gray-400 pt-4">Loading…</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-gray-400 pt-4">No activity recorded yet.</p>
          ) : (
            <div className="relative mt-4">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200" />
              <div className="space-y-4">
                {entries.map((e) => (
                  <div key={e.id} className="flex gap-4 items-start relative">
                    <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs shrink-0 z-10">
                      {ACTION_ICONS[e.action] ?? "·"}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm text-gray-700">{e.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(e.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
