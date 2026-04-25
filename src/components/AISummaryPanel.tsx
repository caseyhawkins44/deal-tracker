"use client"

import { useState, useRef, useEffect } from "react"

type ChatMessage = { role: "user" | "assistant"; content: string }

export default function AISummaryPanel({ dealId }: { dealId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [summary, setSummary] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [question, setQuestion] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatMessages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages])

  async function generate() {
    setState("loading")
    setSummary("")
    setErrorMsg("")
    setChatMessages([])

    try {
      const res = await fetch(`/api/deals/${dealId}/summary`, { method: "POST" })
      const data = await res.json()

      if (!res.ok) {
        if (data.error === "AI_UNAVAILABLE") { setState("idle"); return }
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

  async function askQuestion(e: React.FormEvent) {
    e.preventDefault()
    const q = question.trim()
    if (!q || chatLoading) return

    setQuestion("")
    setChatError("")
    const newHistory = [...chatMessages, { role: "user" as const, content: q }]
    setChatMessages(newHistory)
    setChatLoading(true)

    try {
      const res = await fetch(`/api/deals/${dealId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          // Send prior exchanges only (not the new user message — backend appends it)
          messages: chatMessages,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setChatError(data.error ?? "Something went wrong.")
        setChatMessages(prev => prev.slice(0, -1)) // remove optimistic user msg
      } else {
        setChatMessages(prev => [...prev, { role: "assistant", content: data.answer }])
      }
    } catch {
      setChatError("Network error. Please try again.")
      setChatMessages(prev => prev.slice(0, -1))
    } finally {
      setChatLoading(false)
    }
  }

  if (state === "idle") {
    return (
      <div className="bg-white border border-black/[0.07] rounded-[18px] shadow-sm p-6 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">AI Deal Analysis</h2>
            <p className="text-xs text-gray-400 mt-0.5">Powered by Claude</p>
          </div>
          <button
            onClick={generate}
            className="flex items-center gap-2 bg-[#0071e3] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#0065d1] transition-colors"
          >
            <SparkleIcon />
            Generate Summary
          </button>
        </div>
      </div>
    )
  }

  if (state === "loading") {
    return (
      <div className="bg-white border border-black/[0.07] rounded-[18px] shadow-sm p-6 mt-6">
        <h2 className="font-semibold text-gray-900 mb-4">AI Deal Analysis</h2>
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
        <h2 className="font-semibold text-gray-900 mb-3">AI Deal Analysis</h2>
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

  return (
    <div className="bg-white border border-black/[0.07] rounded-[18px] shadow-sm p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">AI Deal Analysis</h2>
        <button
          onClick={generate}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <SparkleIcon small />
          Regenerate
        </button>
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-800 leading-relaxed">{summary}</p>

      {/* Chat thread */}
      {chatMessages.length > 0 && (
        <div className="mt-5 space-y-3">
          <div className="h-px bg-gray-100" />
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#0071e3] text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-3.5 py-2.5 rounded-2xl rounded-bl-sm">
                <ThinkingDots />
              </div>
            </div>
          )}
          {chatError && (
            <p className="text-xs text-red-500 text-center">{chatError}</p>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Chat input */}
      <form onSubmit={askQuestion} className="mt-4 flex gap-2">
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Ask a question about this deal…"
          disabled={chatLoading}
          className="flex-1 bg-black/[0.03] border border-black/[0.10] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3]/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!question.trim() || chatLoading}
          className="bg-[#0071e3] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#0065d1] disabled:opacity-40 transition-colors shrink-0"
        >
          Ask
        </button>
      </form>

      <p className="text-[11px] text-gray-400 mt-3">Powered by Claude</p>
    </div>
  )
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

function ThinkingDots() {
  return (
    <div className="flex gap-1 items-center h-4">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}
