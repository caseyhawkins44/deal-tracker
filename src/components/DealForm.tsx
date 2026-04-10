"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import CurrencyInput from "@/components/CurrencyInput"
import AddressSearch from "@/components/AddressSearch"
import InfoTooltip from "@/components/InfoTooltip"
import { DEAL_STATUSES, PROPERTY_TYPES, CLOSING_COST_PCT } from "@/lib/constants"

const INSURANCE_PCT = 0.005   // 0.5% of purchase price annually
const MAINTENANCE_PCT = 0.01  // 1.0% of purchase price annually

type DealData = {
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  propertyType: string
  status: string
  zillowUrl: string
  projectId: string | null
  purchasePrice: number
  downPaymentPct: number
  closingCosts: number
  rehabCosts: number
  monthlyRent: number
  // propertyTax stored annual in DB; form works in annual
  propertyTax: number
  insurance: number
  maintenance: number
  utilities: number
  hoaFees: number
  interestRate: number
  loanTermYears: number
  vacancyRate: number
  managementFee: number
  notes: string
}

const DEFAULTS: DealData = {
  name: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  propertyType: "Single Family",
  status: "Prospecting",
  zillowUrl: "",
  projectId: null,
  purchasePrice: 0,
  downPaymentPct: 20,
  closingCosts: 0,
  rehabCosts: 0,
  monthlyRent: 0,
  propertyTax: 0,
  insurance: 0,
  maintenance: 0,
  utilities: 0,
  hoaFees: 0,
  interestRate: 7,
  loanTermYears: 30,
  vacancyRate: 5,
  managementFee: 8,
  notes: "",
}

export default function DealForm({
  initialData,
  dealId,
}: {
  initialData?: Partial<DealData & { propertyTax: number }>
  dealId?: string
}) {
  const router = useRouter()

  const [form, setForm] = useState<DealData>(() => ({
    ...DEFAULTS,
    ...initialData,
    zillowUrl: initialData?.zillowUrl ?? "",
    notes: initialData?.notes ?? "",
    projectId: initialData?.projectId ?? null,
  }))

  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState("")
  // Track if user has manually overridden auto-calculated fields
  const [closingCostsManual, setClosingCostsManual] = useState(
    () => !!(initialData?.closingCosts && initialData.closingCosts > 0)
  )
  const [insuranceManual, setInsuranceManual] = useState(
    () => !!(initialData?.insurance && initialData.insurance > 0)
  )
  const [maintenanceManual, setMaintenanceManual] = useState(
    () => !!(initialData?.maintenance && initialData.maintenance > 0)
  )
  // Track if user has manually set the deal name
  const [nameManual, setNameManual] = useState(
    () => !!(initialData?.name && initialData.name !== initialData?.address?.split(",")[0])
  )

  useEffect(() => {
    fetch("/api/projects").then(r => r.json()).then(setProjects).catch(() => {})
  }, [])

  // Auto-set closing costs when purchase price changes (unless manually edited)
  useEffect(() => {
    if (!closingCostsManual && form.purchasePrice > 0) {
      setForm(f => ({ ...f, closingCosts: Math.round(form.purchasePrice * CLOSING_COST_PCT) }))
    }
  }, [form.purchasePrice, closingCostsManual])

  // Auto-set insurance (0.5% of price/yr ÷ 12) unless manually edited
  useEffect(() => {
    if (!insuranceManual && form.purchasePrice > 0) {
      setForm(f => ({ ...f, insurance: Math.round((form.purchasePrice * INSURANCE_PCT) / 12) }))
    }
  }, [form.purchasePrice, insuranceManual])

  // Auto-set maintenance (1% of price/yr ÷ 12) unless manually edited
  useEffect(() => {
    if (!maintenanceManual && form.purchasePrice > 0) {
      setForm(f => ({ ...f, maintenance: Math.round((form.purchasePrice * MAINTENANCE_PCT) / 12) }))
    }
  }, [form.purchasePrice, maintenanceManual])

  // Auto-set deal name from address (unless manually edited)
  useEffect(() => {
    if (!nameManual && form.address) {
      setForm(f => ({ ...f, name: form.address }))
    }
  }, [form.address, nameManual])

  function set(field: keyof DealData, value: string | number) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function importFromZillow() {
    if (!form.zillowUrl.includes("zillow.com")) {
      setImportError("Enter a valid Zillow URL first")
      return
    }
    setImporting(true)
    setImportError("")
    const res = await fetch("/api/zillow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: form.zillowUrl }),
    })
    const data = await res.json()
    setImporting(false)
    if (!res.ok) {
      setImportError(data.error ?? "Import failed")
      return
    }
    setForm(f => ({
      ...f,
      ...(data.address && { address: data.address }),
      ...(data.city && { city: data.city }),
      ...(data.state && { state: data.state }),
      ...(data.zipCode && { zipCode: data.zipCode }),
      ...(data.name && !nameManual && { name: data.name }),
      ...(data.propertyType && { propertyType: data.propertyType }),
      ...(data.purchasePrice && { purchasePrice: data.purchasePrice }),
      ...(data.propertyTax && { propertyTax: data.propertyTax }),
      ...(data.hoaFees && { hoaFees: data.hoaFees }),
      ...(data.monthlyRent && { monthlyRent: data.monthlyRent }),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.purchasePrice) { setError("Purchase price is required"); return }
    if (!form.monthlyRent) { setError("Monthly rent is required"); return }
    setError("")
    setLoading(true)

    const url = dealId ? `/api/deals/${dealId}` : "/api/deals"
    const method = dealId ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    setLoading(false)
    if (!res.ok) {
      const text = await res.text()
      let message = "Something went wrong"
      try { message = JSON.parse(text).error ?? message } catch { message = text || message }
      setError(message)
      return
    }
    const deal = await res.json()
    router.push(`/deals/${deal.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Property Info */}
      <section className="bg-white border border-black/[0.07] rounded-[18px] shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Property Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Address with autocomplete */}
          <Field label="Street Address" className="md:col-span-2" required>
            <AddressSearch
              value={form.address}
              onChange={v => set("address", v)}
              onSelect={s => {
                setForm(f => ({
                  ...f,
                  address: s.street,
                  city: s.city,
                  state: s.state,
                  zipCode: s.zipCode,
                  name: nameManual ? f.name : s.street,
                }))
              }}
              className={inputCls}
            />
          </Field>

          <Field label="City" required>
            <input
              type="text"
              required
              value={form.city}
              onChange={e => set("city", e.target.value)}
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="State" required>
              <input
                type="text"
                required
                maxLength={2}
                placeholder="TX"
                value={form.state}
                onChange={e => set("state", e.target.value.toUpperCase())}
                className={inputCls}
              />
            </Field>
            <Field label="ZIP" required>
              <input
                type="text"
                required
                value={form.zipCode}
                onChange={e => set("zipCode", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Deal Name" required>
            <input
              type="text"
              required
              placeholder="Auto-filled from address"
              value={form.name}
              onChange={e => {
                setNameManual(true)
                set("name", e.target.value)
              }}
              className={inputCls}
            />
          </Field>

          <Field label="Property Type">
            <select
              value={form.propertyType}
              onChange={e => set("propertyType", e.target.value)}
              className={inputCls}
            >
              {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>

          <Field label="Status">
            <select
              value={form.status}
              onChange={e => set("status", e.target.value)}
              className={inputCls}
            >
              {DEAL_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="Project">
            <select
              value={form.projectId ?? ""}
              onChange={e => set("projectId", e.target.value)}
              className={inputCls}
            >
              <option value="">— No project —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>

          <Field label="Zillow URL" className="md:col-span-2">
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://www.zillow.com/homedetails/..."
                value={form.zillowUrl}
                onChange={e => set("zillowUrl", e.target.value)}
                className={`${inputCls} flex-1`}
              />
              <button
                type="button"
                onClick={importFromZillow}
                disabled={importing || !form.zillowUrl}
                className="bg-[#0071e3] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#0065d1] disabled:opacity-40 shrink-0"
              >
                {importing ? "Importing…" : "Import"}
              </button>
            </div>
            {importError && <p className="text-xs text-red-600 mt-1">{importError}</p>}
            {!importError && (
              <p className="text-xs text-gray-400 mt-1">Paste a Zillow listing URL and click Import to auto-fill fields below.</p>
            )}
          </Field>
        </div>
      </section>

      {/* Purchase & Financing */}
      <section className="bg-white border border-black/[0.07] rounded-[18px] shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Purchase & Financing</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <Field label="Purchase Price" required>
            <CurrencyInput
              value={form.purchasePrice}
              onChange={v => set("purchasePrice", v)}
              className={inputCls}
            />
          </Field>

          <Field label="Down Payment (%)">
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.downPaymentPct}
              onChange={e => set("downPaymentPct", parseFloat(e.target.value) || 0)}
              className={inputCls}
            />
          </Field>

          <Field
            label={
              <>
                Closing Costs
                {!closingCostsManual && form.purchasePrice > 0 && (
                  <span className="text-[10px] text-[#0071e3] bg-[#e8f1fb] border border-[#0071e3]/25 px-1.5 rounded-full font-normal">
                    estimated 2.5%
                  </span>
                )}
              </>
            }
          >
            <CurrencyInput
              value={form.closingCosts}
              onChange={v => {
                setClosingCostsManual(true)
                set("closingCosts", v)
              }}
              className={inputCls}
            />
          </Field>

          <Field label="Rehab / Repairs">
            <CurrencyInput
              value={form.rehabCosts}
              onChange={v => set("rehabCosts", v)}
              className={inputCls}
            />
          </Field>

          <Field label="Interest Rate (%)">
            <input
              type="number"
              min={0}
              max={30}
              step={0.125}
              value={form.interestRate}
              onChange={e => set("interestRate", parseFloat(e.target.value) || 0)}
              className={inputCls}
            />
          </Field>

          <Field label="Loan Term (years)">
            <select
              value={form.loanTermYears}
              onChange={e => set("loanTermYears", parseInt(e.target.value))}
              className={inputCls}
            >
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
            </select>
          </Field>
        </div>
      </section>

      {/* Income & Expenses */}
      <section className="bg-white border border-black/[0.07] rounded-[18px] shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Income & Expenses</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <Field label="Monthly Rent" required>
            <CurrencyInput
              value={form.monthlyRent}
              onChange={v => set("monthlyRent", v)}
              className={inputCls}
            />
          </Field>

          <Field label="Vacancy Rate (%)">
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={form.vacancyRate}
              onChange={e => set("vacancyRate", parseFloat(e.target.value) || 0)}
              className={inputCls}
            />
          </Field>

          <Field label={
            <>
              Mgmt Fee (%)
              <InfoTooltip content="Default 8% — the typical rate charged by residential property managers for single-family homes (range: 8–12%). Set to 0 if self-managing." />
            </>
          }>
            <input
              type="number"
              min={0}
              max={30}
              step={0.5}
              value={form.managementFee}
              onChange={e => set("managementFee", parseFloat(e.target.value) || 0)}
              className={inputCls}
            />
          </Field>

          <Field label="Annual Property Tax">
            <CurrencyInput
              value={form.propertyTax}
              onChange={v => set("propertyTax", v)}
              className={inputCls}
            />
          </Field>

          <Field label={
            <>
              Insurance ($/mo)
              {!insuranceManual && form.purchasePrice > 0 && (
                <span className="text-[10px] text-[#0071e3] bg-[#e8f1fb] border border-[#0071e3]/25 px-1.5 rounded-full font-normal">est. 0.5%/yr</span>
              )}
              <InfoTooltip content="Estimated at 0.5% of purchase price per year ÷ 12. Landlord insurance (dwelling policy) typically runs 0.4–0.8% of home value annually depending on location, age, and coverage." />
            </>
          }>
            <CurrencyInput
              value={form.insurance}
              onChange={v => { setInsuranceManual(true); set("insurance", v) }}
              className={inputCls}
            />
          </Field>

          <Field label={
            <>
              Maintenance ($/mo)
              {!maintenanceManual && form.purchasePrice > 0 && (
                <span className="text-[10px] text-[#0071e3] bg-[#e8f1fb] border border-[#0071e3]/25 px-1.5 rounded-full font-normal">est. 1%/yr</span>
              )}
              <InfoTooltip content="Estimated at 1% of purchase price per year ÷ 12 — the standard rule of thumb for ongoing repairs and upkeep. Older homes or those needing work may run higher (1.5–2%)." />
            </>
          }>
            <CurrencyInput
              value={form.maintenance}
              onChange={v => { setMaintenanceManual(true); set("maintenance", v) }}
              className={inputCls}
            />
          </Field>

          <Field label={
            <>
              Utilities ($/mo)
              <InfoTooltip content="Default $0 — utilities are typically paid by the tenant in single-family rentals. Enter a monthly amount if you cover water, trash, or other utilities as the landlord." />
            </>
          }>
            <CurrencyInput
              value={form.utilities}
              onChange={v => set("utilities", v)}
              className={inputCls}
            />
          </Field>

          <Field label="HOA Fees ($/mo)">
            <CurrencyInput
              value={form.hoaFees}
              onChange={v => set("hoaFees", v)}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      {/* Notes */}
      <section className="bg-white border border-black/[0.07] rounded-[18px] shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Notes</h2>
        <textarea
          rows={4}
          placeholder="Any additional notes about this deal…"
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
          className={`${inputCls} resize-none`}
        />
      </section>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#0071e3] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#0065d1] disabled:opacity-50"
        >
          {loading ? "Saving…" : dealId ? "Save Changes" : "Add Deal"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="border border-black/[0.12] text-gray-700 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-black/[0.04]"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

const inputCls =
  "w-full bg-black/[0.03] border border-black/[0.10] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3]/50"

function Field({
  label,
  required,
  className,
  children,
}: {
  label: React.ReactNode
  required?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label className="flex items-center text-xs font-medium text-gray-600 mb-1 gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
