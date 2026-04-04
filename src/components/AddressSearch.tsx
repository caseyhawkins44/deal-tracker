"use client"

import { useState, useRef, useEffect } from "react"

type Suggestion = {
  display: string
  street: string
  city: string
  state: string
  zipCode: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  onSelect: (s: Suggestion) => void
  className?: string
}

export default function AddressSearch({ value, onChange, onSelect, className }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    onChange(v)
    setOpen(false)

    if (debounce.current) clearTimeout(debounce.current)
    if (v.length < 4) { setSuggestions([]); return }

    let cancelled = false
    debounce.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/address-search?q=${encodeURIComponent(v)}`)
        const data = await res.json()
        if (!cancelled) {
          setSuggestions(data)
          setOpen(data.length > 0)
        }
      } catch {
        if (!cancelled) setSuggestions([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 400)
    return () => { cancelled = true }
  }

  function handleSelect(s: Suggestion) {
    onChange(s.street)
    onSelect(s)
    setOpen(false)
    setSuggestions([])
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="123 Main St"
          required
          className={className}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">searching…</span>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={() => handleSelect(s)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{s.street}</span>
                <span className="text-gray-500">, {s.city}, {s.state} {s.zipCode}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
