"use client"

import { useState } from "react"

interface Props {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  required?: boolean
  className?: string
}

// Text input that displays formatted "$1,234" and accepts plain number entry.
// Always shows $0 when value is 0 (after the user has blurred once), allowing
// explicit $0 entry on optional fields.
export default function CurrencyInput({ value, onChange, placeholder = "0", required, className }: Props) {
  const [focused, setFocused] = useState(false)
  const [raw, setRaw] = useState("")
  const [touched, setTouched] = useState(false)

  const displayValue = focused
    ? raw
    : touched || value > 0
    ? "$" + value.toLocaleString("en-US")
    : ""

  function handleFocus() {
    setFocused(true)
    setRaw(value > 0 ? String(value) : "")
  }

  function handleBlur() {
    setFocused(false)
    setTouched(true)
    const num = parseInt(raw.replace(/[^0-9]/g, ""))
    onChange(isNaN(num) ? 0 : num)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      required={required && !touched && value === 0}
      placeholder={"$" + placeholder}
      value={displayValue}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={e => setRaw(e.target.value.replace(/[^0-9]/g, ""))}
      className={className}
    />
  )
}
