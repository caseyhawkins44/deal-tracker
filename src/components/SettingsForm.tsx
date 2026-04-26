"use client"

import { useState } from "react"
import type { InvestmentCriteriaType } from "@/lib/criteria"

type FormState = InvestmentCriteriaType

export default function SettingsForm({
  initialValues,
}: {
  initialValues: FormState & { id: string }
}) {
  const [form, setForm] = useState<FormState>({
    minCashOnCash: initialValues.minCashOnCash,
    minCapRate: initialValues.minCapRate,
    minDscr: initialValues.minDscr,
    maxGrm: initialValues.maxGrm,
    minMonthlyCashFlow: initialValues.minMonthlyCashFlow,
    ignoreCashOnCash: initialValues.ignoreCashOnCash ?? false,
    ignoreCapRate: initialValues.ignoreCapRate ?? false,
    ignoreDscr: initialValues.ignoreDscr ?? false,
    ignoreGrm: initialValues.ignoreGrm ?? false,
    ignoreCashFlow: initialValues.ignoreCashFlow ?? false,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  function set(field: keyof FormState, value: number) {
    setForm((f) => ({ ...f, [field]: value }))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    setError("")
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to save")
    }
  }

  return (
    <div className="bg-white border border-black/[0.07] rounded-[18px] shadow-sm p-6 space-y-6">
      <SettingField
        label="Minimum Cash-on-Cash Return"
        unit="%"
        value={form.minCashOnCash}
        onChange={(v) => set("minCashOnCash", v)}
        step={0.5}
        hint="Deals below this show a red dot on Cash-on-Cash."
      />
      <SettingField
        label="Minimum Cap Rate"
        unit="%"
        value={form.minCapRate}
        onChange={(v) => set("minCapRate", v)}
        step={0.5}
        hint="Deals below this show a red dot on Cap Rate."
      />
      <SettingField
        label="Minimum DSCR"
        unit="x"
        value={form.minDscr}
        onChange={(v) => set("minDscr", v)}
        step={0.05}
        hint="Debt Service Coverage Ratio. Below 1.0 means the property can't service its own debt."
      />
      <SettingField
        label="Maximum GRM"
        unit="x"
        value={form.maxGrm}
        onChange={(v) => set("maxGrm", v)}
        step={0.5}
        hint="Gross Rent Multiplier. Lower is better — deals above this show a red dot."
      />
      <SettingField
        label="Minimum Monthly Cash Flow"
        unit="$"
        unitPrefix
        value={form.minMonthlyCashFlow}
        onChange={(v) => set("minMonthlyCashFlow", v)}
        step={50}
        hint="Deals below this monthly cash flow show a red dot."
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <button
          onClick={save}
          disabled={saving}
          className="bg-[#0071e3] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0065d1] disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save Criteria"}
        </button>
        {saved && <p className="text-sm text-green-600 font-medium">Saved!</p>}
      </div>
    </div>
  )
}

function SettingField({
  label,
  unit,
  unitPrefix = false,
  value,
  onChange,
  step,
  hint,
}: {
  label: string
  unit: string
  unitPrefix?: boolean
  value: number
  onChange: (v: number) => void
  step: number
  hint: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        {unitPrefix && <span className="text-sm text-gray-500">{unit}</span>}
        <input
          type="number"
          value={value}
          step={step}
          min={0}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40"
        />
        {!unitPrefix && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
      <p className="text-xs text-gray-400 mt-1">{hint}</p>
    </div>
  )
}
