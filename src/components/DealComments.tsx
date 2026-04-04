"use client"

import { useState, useEffect, useCallback } from "react"

type Comment = {
  id: string
  body: string
  isFlagged: boolean
  createdAt: string
  user: { name: string | null; email: string | null }
  userId: string
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

function renderBody(text: string) {
  return text.split(/(@\w+)/g).map((part, i) =>
    part.startsWith("@") ? (
      <strong key={i} className="text-blue-600 font-semibold">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

export default function DealComments({
  dealId,
  currentUserId,
}: {
  dealId: string
  currentUserId: string
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState("")
  const [posting, setPosting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/deals/${dealId}/comments`)
    if (res.ok) setComments(await res.json())
    setLoading(false)
  }, [dealId])

  useEffect(() => { load() }, [load])

  async function post() {
    if (!body.trim()) return
    setPosting(true)
    const res = await fetch(`/api/deals/${dealId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    })
    if (res.ok) {
      setBody("")
      await load()
    }
    setPosting(false)
  }

  async function toggleFlag(id: string) {
    await fetch(`/api/comments/${id}/flag`, { method: "PATCH" })
    await load()
  }

  async function confirmDelete(id: string) {
    await fetch(`/api/comments/${id}`, { method: "DELETE" })
    setDeleteTarget(null)
    await load()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 mt-6">
      <h2 className="font-semibold mb-4">Discussion</h2>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400 mb-4">No comments yet — be the first to leave one.</p>
      ) : (
        <div className="space-y-4 mb-6">
          {comments.map((c) => (
            <div
              key={c.id}
              className={`rounded-xl p-4 ${
                c.isFlagged
                  ? "bg-amber-50 border border-amber-200"
                  : "bg-gray-50 border border-gray-100"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {c.user.name ?? c.user.email}
                  </span>
                  {c.isFlagged && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                      Decision note
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFlag(c.id)}
                    title={c.isFlagged ? "Unflag" : "Flag as decision note"}
                    className={`text-sm transition-colors ${
                      c.isFlagged ? "text-amber-500 hover:text-amber-700" : "text-gray-300 hover:text-amber-400"
                    }`}
                  >
                    ⚑
                  </button>
                  {c.userId === currentUserId && (
                    deleteTarget === c.id ? (
                      <span className="flex items-center gap-1 text-xs">
                        <span className="text-gray-500">Delete?</span>
                        <button
                          onClick={() => confirmDelete(c.id)}
                          className="text-red-600 font-medium hover:underline"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteTarget(null)}
                          className="text-gray-500 hover:underline"
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setDeleteTarget(c.id)}
                        className="text-xs text-gray-300 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    )
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{renderBody(c.body)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <textarea
          rows={3}
          placeholder="Add a comment… Use @Name to mention a partner"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <button
          onClick={post}
          disabled={posting || !body.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
        >
          {posting ? "Posting…" : "Post Comment"}
        </button>
      </div>
    </div>
  )
}
