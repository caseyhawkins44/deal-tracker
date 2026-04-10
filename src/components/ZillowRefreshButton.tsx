"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ZillowRefreshButton({
  dealId,
  zillowUrl,
}: {
  dealId: string
  zillowUrl: string | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [result, setResult] = useState<{
    updated: boolean
    changes: string[]
    priceChange: number | null
    priceChangeDate: string | null
    homeStatus: string | null
  } | null>(null)
  const [error, setError] = useState("")

  async function refresh(urlOverride?: string) {
    setLoading(true)
    setResult(null)
    setError("")

    const body = urlOverride ? { url: urlOverride } : {}
    const res = await fetch(`/api/deals/${dealId}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? "Refresh failed")
      return
    }

    setShowUrlInput(false)
    setResult(data)
    if (data.updated) router.refresh()
  }

  if (!zillowUrl && !showUrlInput) {
    return (
      <button
        onClick={() => setShowUrlInput(true)}
        className="text-xs text-[#0071e3] hover:underline"
      >
        Link Zillow listing →
      </button>
    )
  }

  if (!zillowUrl && showUrlInput) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex gap-2 items-center">
          <input
            type="url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="https://www.zillow.com/homedetails/..."
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 w-72"
            autoFocus
          />
          <button
            onClick={() => refresh(urlInput)}
            disabled={loading || !urlInput.includes("zillow.com")}
            className="bg-[#0071e3] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[#0065d1] disabled:opacity-40 shrink-0"
          >
            {loading ? "Linking…" : "Link & Refresh"}
          </button>
          <button
            onClick={() => setShowUrlInput(false)}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() => refresh()}
        disabled={loading}
        className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40"
      >
        <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {loading ? "Refreshing…" : "Refresh from Zillow"}
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {result && !error && (
        <div className="text-xs text-right space-y-0.5">
          {result.updated ? (
            result.changes.map((c, i) => (
              <p key={i} className="text-green-600">Updated: {c}</p>
            ))
          ) : (
            <p className="text-gray-500">No changes — already up to date</p>
          )}
          {result.priceChange && result.priceChangeDate && (
            <p className="text-amber-600">
              Price dropped ${Math.abs(result.priceChange).toLocaleString()} on {new Date(result.priceChangeDate).toLocaleDateString()}
            </p>
          )}
          {result.homeStatus && result.homeStatus !== "FOR_SALE" && result.homeStatus !== "OTHER" && (
            <p className="text-red-600">Status: {result.homeStatus.replace(/_/g, " ")}</p>
          )}
        </div>
      )}
    </div>
  )
}
