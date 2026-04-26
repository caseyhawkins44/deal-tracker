export type InvestmentCriteriaType = {
  minCashOnCash: number
  minCapRate: number
  minDscr: number
  maxGrm: number
  minMonthlyCashFlow: number
  ignoreCashOnCash: boolean
  ignoreCapRate: boolean
  ignoreDscr: boolean
  ignoreGrm: boolean
  ignoreCashFlow: boolean
}

export const DEFAULT_CRITERIA: InvestmentCriteriaType = {
  minCashOnCash: 8,
  minCapRate: 6,
  minDscr: 1.25,
  maxGrm: 12,
  minMonthlyCashFlow: 100,
  ignoreCashOnCash: false,
  ignoreCapRate: false,
  ignoreDscr: false,
  ignoreGrm: false,
  ignoreCashFlow: false,
}

/** Returns "green" | "amber" | "red" for a metric vs its target.
 *  Pass ignored=true to always return "green" (metric not being enforced). */
export function metricDot(
  value: number,
  target: number,
  higherIsBetter = true,
  ignored = false
): "green" | "amber" | "red" {
  if (ignored) return "green"
  if (higherIsBetter) {
    if (value >= target) return "green"
    if (value >= target * 0.8) return "amber"
    return "red"
  } else {
    if (value <= target) return "green"
    if (value <= target * 1.2) return "amber"
    return "red"
  }
}
