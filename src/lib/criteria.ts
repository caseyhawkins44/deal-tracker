export type InvestmentCriteriaType = {
  minCashOnCash: number
  minCapRate: number
  minDscr: number
  maxGrm: number
  minMonthlyCashFlow: number
}

export const DEFAULT_CRITERIA: InvestmentCriteriaType = {
  minCashOnCash: 8,
  minCapRate: 6,
  minDscr: 1.25,
  maxGrm: 12,
  minMonthlyCashFlow: 100,
}

/** Returns "green" | "amber" | "red" for a metric vs its target */
export function metricDot(
  value: number,
  target: number,
  higherIsBetter = true
): "green" | "amber" | "red" {
  if (higherIsBetter) {
    if (value >= target) return "green"
    if (value >= target * 0.8) return "amber"
    return "red"
  } else {
    // lower is better (GRM)
    if (value <= target) return "green"
    if (value <= target * 1.2) return "amber"
    return "red"
  }
}
