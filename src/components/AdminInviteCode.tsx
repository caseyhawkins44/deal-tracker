"use client"

import { useState } from "react"

export default function AdminInviteCode({ currentCode }: { currentCode: string | null }) {
  const [code, setCode] = useState(currentCode ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [visible, setVisible] = useState(false)

  async function save() {
    setSaving(true)
    setSaved(false)
    setError("")
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: code }),
    })
    setSaving(false)
    if (res.ok) {
      const data = await res.json()
      setCode(data.inviteCode ?? "")
      setSaved(true)
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to save")
    }
  }

  const isEnabled = code.trim().length > 0
  const displayCode = currentCode ?? null

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-1">
        <h2 className="font-semibold text-gray-900">Invite Code</h2>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
          displayCode
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-gray-50 text-gray-500 border-gray-200"
        }`}>
          {displayCode ? "Required" : "Disabled"}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        When set, anyone creating an account must enter this code. Leave blank to allow open registration.
      </p>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-xs">
          <input
            type={visible ? "text" : "password"}
            value={code}
            onChange={e => { setCode(e.target.value); setSaved(false) }}
            placeholder="Enter an invite code…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            tabIndex={-1}
          >
            {visible ? "Hide" : "Show"}
          </button>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 shrink-0"
        >
          {saving ? "Saving…" : isEnabled ? "Save Code" : "Disable"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">
            {code.trim() ? "Code updated" : "Invite code disabled"}
          </span>
        )}
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      {isEnabled && (
        <p className="text-xs text-gray-400 mt-2">
          Share this code with people you want to allow to register.
        </p>
      )}
    </div>
  )
}
