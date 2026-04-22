/**
 * Validates and coerces numeric deal fields from API input.
 * Returns { data } on success or { error, status } on failure.
 */
export function parseDealNumbers(body: Record<string, unknown>):
  | { error: string; status: number }
  | {
      purchasePrice: number
      downPaymentPct: number
      closingCosts: number
      rehabCosts: number
      monthlyRent: number
      propertyTax: number
      insurance: number
      maintenance: number
      utilities: number
      hoaFees: number
      interestRate: number
      loanTermYears: number
      vacancyRate: number
      managementFee: number
    } {
  const fields: Array<{ key: string; min: number; max: number }> = [
    { key: "purchasePrice", min: 1, max: 100_000_000 },
    { key: "downPaymentPct", min: 0, max: 100 },
    { key: "closingCosts", min: 0, max: 10_000_000 },
    { key: "rehabCosts", min: 0, max: 10_000_000 },
    { key: "monthlyRent", min: 0, max: 1_000_000 },
    { key: "propertyTax", min: 0, max: 1_000_000 },
    { key: "insurance", min: 0, max: 100_000 },
    { key: "maintenance", min: 0, max: 100_000 },
    { key: "utilities", min: 0, max: 100_000 },
    { key: "hoaFees", min: 0, max: 100_000 },
    { key: "interestRate", min: 0, max: 30 },
    { key: "loanTermYears", min: 1, max: 50 },
    { key: "vacancyRate", min: 0, max: 100 },
    { key: "managementFee", min: 0, max: 100 },
  ]

  const result: Record<string, number> = {}
  for (const { key, min, max } of fields) {
    const raw = body[key]
    const val = Number(raw ?? 0)
    if (!isFinite(val) || val < min || val > max) {
      return { error: `${key} must be a number between ${min} and ${max}`, status: 400 }
    }
    result[key] = val
  }

  return result as ReturnType<typeof parseDealNumbers> & object
}
