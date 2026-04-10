"use client"

import { useState } from "react"

export default function AISummaryPanel({ dealId }: { dealId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [summary, setSummary] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  async function generate() {
    setState("loading")
    setSummary("")
    setErrorMsg("")

    try {
      const res = await fetch(`/api/deals/${dealId}/summary`, { method: "POST" })
      const data = await res.json()

      if (!res.ok) {
        if (data.error === "AI_UNAVAILABLE") {
          setState("idle") // hide silently — key not configured
          return
        }
        setErrorMsg(data.error ?? "Something went wrong. Please try again.")
        setState("error")
        return
      }

      setSummary(data.summary)
      setState("done")
    } catch {
      setErrorMsg("Network error. Please try again.")
      setState("error")
    }
  }

  // Hide entirely if we just discovered the key isn't set
  if (state === "idle" && errorMsg === "" && summary === "") {
    return (
      <div className="bg-white border border-black/[0.07] rounded-[18px] shadow-sm p-6 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">AI Deal Summary</h2>
            <p className="text-xs text-gray-400 mt-0.5">Powered by Claude</p>
          </div>
          <button
            onClick={generate}
            className="flex items-center gap-2 bg-[#0071e3] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#0065d1] transition-colors"
          >
            <SparkleIcon />
            Generate AI Summary
          </button>
        </div>
      </div>
    )
  }

  if (state === "loading") {
    return (
      <div className="bg-white border border-black/[0.07] rounded-[18px] shadow-sm p-6 mt-6">
        <h2 className="font-semibold text-gray-900 mb-4">AI Deal Summary</h2>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Spinner />
          Analyzing deal…
        </div>
      </div>
    )
  }

  if (state === "error") {
    return (
      <div className="bg-white border border-black/[0.07] rounded-[18px] shadow-sm p-6 mt-6">
        <h2 className="font-semibold text-gray-900 mb-3">AI Deal Summary</h2>
        <p className="text-sm text-amber-600 mb-3">{errorMsg}</p>
        <button
          onClick={generate}
          className="flex items-center gap-2 border border-black/[0.12] text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/[0.04] transition-colors"
        >
          <SparkleIcon />
          Try again
        </button>
      </div>
    )
  }

  if (state === "done") {
    return (
      <div className="bg-white border border-black/[0.07] rounded-[18px] shadow-sm p-6 mt-6">
        <h2 className="font-semibold text-gray-900 mb-4">AI Deal Summary</h2>
        <p className="text-sm text-gray-800 leading-relaxed">{summary}</p>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-400">Powered by Claude</p>
          <button
            onClick={generate}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <SparkleIcon small />
            Regenerate
          </button>
        </div>
      </div>
    )
  }

  return null
}

function SparkleIcon({ small }: { small?: boolean }) {
  const size = small ? 12 : 14
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M5 3l.9 2.1L8 6l-2.1.9L5 9l-.9-2.1L2 6l2.1-.9z" />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
    </svg>
  )
}
