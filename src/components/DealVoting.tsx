"use client"

import { useState, useEffect, useCallback } from "react"
import { timeAgo } from "@/lib/timeAgo"

type VoteOption = "GO" | "NO_GO" | "NEED_MORE_INFO"

type Vote = {
  id: string
  vote: VoteOption
  note: string
  createdAt: string
  updatedAt: string
  userId: string
  user: { name: string | null; email: string | null }
}

const VOTE_LABELS: Record<VoteOption, string> = {
  GO: "Go",
  NO_GO: "No-Go",
  NEED_MORE_INFO: "Need More Info",
}

const VOTE_COLORS: Record<VoteOption, string> = {
  GO: "bg-green-100 text-green-700 border-green-200",
  NO_GO: "bg-red-100 text-red-700 border-red-200",
  NEED_MORE_INFO: "bg-amber-100 text-amber-700 border-amber-200",
}

const VOTE_BTN: Record<VoteOption, string> = {
  GO: "border-green-300 text-green-700 hover:bg-green-50",
  NO_GO: "border-red-300 text-red-700 hover:bg-red-50",
  NEED_MORE_INFO: "border-amber-300 text-amber-700 hover:bg-amber-50",
}

const VOTE_BTN_ACTIVE: Record<VoteOption, string> = {
  GO: "bg-green-600 text-white border-green-600",
  NO_GO: "bg-red-600 text-white border-red-600",
  NEED_MORE_INFO: "bg-amber-500 text-white border-amber-500",
}

export default function DealVoting({
  dealId,
  currentUserId,
}: {
  dealId: string
  currentUserId: string
}) {
  const [votes, setVotes] = useState<Vote[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState<VoteOption | null>(null)
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    const res = await fetch(`/api/deals/${dealId}/votes`)
    if (res.ok) {
      const data: Vote[] = await res.json()
      setVotes(data)
      const mine = data.find((v) => v.userId === currentUserId)
      if (mine && !editing) {
        setSelected(mine.vote)
        setNote(mine.note)
      }
    }
    setLoading(false)
  }, [dealId, currentUserId, editing])

  useEffect(() => { load() }, [load])

  const myVote = votes.find((v) => v.userId === currentUserId)

  const tally = (["GO", "NO_GO", "NEED_MORE_INFO"] as VoteOption[]).map((v) => ({
    option: v,
    count: votes.filter((vt) => vt.vote === v).length,
  }))

  async function submit() {
    if (!selected) { setError("Please select a vote"); return }
    if (note.trim().length < 10) { setError("Note must be at least 10 characters"); return }
    setError("")
    setSaving(true)
    const res = await fetch(`/api/deals/${dealId}/votes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vote: selected, note }),
    })
    setSaving(false)
    if (res.ok) {
      setEditing(false)
      await load()
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to save vote")
    }
  }

  return (
    <div className="bg-white border border-black/[0.07] rounded-[18px] shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Partner Votes</h2>
        {votes.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {tally.filter((t) => t.count > 0).map((t) => (
              <span key={t.option}>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${VOTE_COLORS[t.option]}`}>
                  {t.count} {VOTE_LABELS[t.option]}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <>
          {/* All votes */}
          {votes.length > 0 && (
            <div className="space-y-3 mb-4">
              {votes.map((v) => (
                <div key={v.id} className="flex gap-3 items-start">
                  <span
                    className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold border ${VOTE_COLORS[v.vote]}`}
                  >
                    {VOTE_LABELS[v.vote]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {v.user.name ?? v.user.email}
                      </span>
                      <span className="text-xs text-gray-400">{timeAgo(v.updatedAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{v.note}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {votes.length === 0 && !myVote && (
            <p className="text-sm text-gray-400 mb-4">No votes yet — cast yours below.</p>
          )}

          {/* Voting form: show if no vote yet, or editing */}
          {(!myVote || editing) ? (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">
                {myVote ? "Update your vote" : "Cast your vote"}
              </p>
              <div className="flex gap-2 flex-wrap">
                {(["GO", "NO_GO", "NEED_MORE_INFO"] as VoteOption[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setSelected(v)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      selected === v ? VOTE_BTN_ACTIVE[v] : VOTE_BTN[v]
                    }`}
                  >
                    {VOTE_LABELS[v]}
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                placeholder="Explain your reasoning (required, min 10 characters)…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-black/[0.03] border border-black/[0.10] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3]/50 resize-none"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={submit}
                  disabled={saving}
                  className="bg-[#0071e3] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#0065d1] disabled:opacity-40"
                >
                  {saving ? "Saving…" : myVote ? "Update Vote" : "Submit Vote"}
                </button>
                {editing && (
                  <button
                    onClick={() => { setEditing(false); setSelected(myVote?.vote ?? null); setNote(myVote?.note ?? "") }}
                    className="border border-black/[0.12] text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/[0.04]"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-100 pt-4 flex items-center gap-3">
              <span className="text-sm text-gray-500">Your vote:</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${VOTE_COLORS[myVote.vote]}`}>
                {VOTE_LABELS[myVote.vote]}
              </span>
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-[#0071e3] hover:underline"
              >
                Edit Vote
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
