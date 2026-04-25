import { analyzeDeal, type Deal } from "@/lib/calculations"
import { DEFAULT_CRITERIA, type InvestmentCriteriaType } from "@/lib/criteria"

function dollar(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}

function pct(n: number): string {
  return n.toFixed(2) + "%"
}

function meets(value: number, target: number, higherIsBetter = true): string {
  return (higherIsBetter ? value >= target : value <= target) ? "MEETS" : "MISSES"
}

type DealWithMeta = Deal & {
  address: string
  city: string
  state: string
  zipCode: string
  propertyType: string
  status: string
  zillowUrl?: string | null
  notes?: string | null
}

export function buildDealContext(deal: DealWithMeta, criteriaRow: InvestmentCriteriaType | null): string {
  const m = analyzeDeal(deal)
  const c = criteriaRow ?? DEFAULT_CRITERIA
  const totalCashNeeded = m.downPayment + deal.closingCosts + deal.rehabCosts

  return `PROPERTY: ${deal.address}, ${deal.city} ${deal.state} ${deal.zipCode}
Type: ${deal.propertyType}
Asking price: ${dollar(deal.purchasePrice)}
Status: ${deal.status}${deal.zillowUrl ? `\nListed at: ${deal.zillowUrl}` : ""}

FINANCING:
Down payment: ${deal.downPaymentPct}% (${dollar(m.downPayment)})
Interest rate: ${deal.interestRate}%
Loan term: ${deal.loanTermYears} years
Closing costs: ${dollar(deal.closingCosts)}
Rehab costs: ${dollar(deal.rehabCosts)}
Total cash needed: ${dollar(totalCashNeeded)}

INCOME & EXPENSES:
Monthly rent: ${dollar(deal.monthlyRent)}
Vacancy rate: ${deal.vacancyRate}%
Effective monthly rent: ${dollar(m.effectiveRent)}
Monthly mortgage (P&I): ${dollar(m.monthlyMortgage)}
Monthly operating expenses: ${dollar(m.monthlyOperatingExpenses)}
  Property tax: ${dollar(m.monthlyPropertyTax)}/mo (${dollar(deal.propertyTax)}/yr)
  Insurance: ${dollar(deal.insurance)}/mo
  Maintenance: ${dollar(deal.maintenance)}/mo
  CapEx reserve: ${dollar(deal.capexReserve)}/mo
  Utilities: ${dollar(deal.utilities)}/mo
  HOA fees: ${dollar(deal.hoaFees)}/mo
  Management fee (${deal.managementFee}%): ${dollar(m.effectiveRent * deal.managementFee / 100)}/mo
Monthly cash flow: ${dollar(m.monthlyCashFlow)}
Annual cash flow: ${dollar(m.annualCashFlow)}

KEY METRICS:
Cap rate: ${pct(m.capRate)}
Cash-on-cash return: ${pct(m.cashOnCash)}
Gross rent multiplier: ${m.grm.toFixed(1)}x
Gross yield: ${pct(m.grossYield)}
DSCR: ${m.dscr === 999 ? "N/A (no debt)" : m.dscr.toFixed(2) + "x"}

TEAM INVESTMENT CRITERIA:
Minimum cap rate: ${pct(c.minCapRate)}
Minimum cash-on-cash return: ${pct(c.minCashOnCash)}
Minimum monthly cash flow: ${dollar(c.minMonthlyCashFlow)}
Minimum DSCR: ${c.minDscr}x
Maximum GRM: ${c.maxGrm}x

CRITERIA CHECK:
Cap rate: ${meets(m.capRate, c.minCapRate)} target (${pct(m.capRate)} vs ${pct(c.minCapRate)} minimum)
Cash-on-cash: ${meets(m.cashOnCash, c.minCashOnCash)} target (${pct(m.cashOnCash)} vs ${pct(c.minCashOnCash)} minimum)
Monthly cash flow: ${meets(m.monthlyCashFlow, c.minMonthlyCashFlow)} target (${dollar(m.monthlyCashFlow)} vs ${dollar(c.minMonthlyCashFlow)} minimum)${deal.notes?.trim() ? `\n\nDEAL NOTES:\n${deal.notes.trim()}` : ""}`
}

export const DEAL_ANALYST_SYSTEM_PROMPT = `You are a concise real estate investment analyst. You have been given full financial data for a specific deal. Answer questions about it directly and with numbers. Be brief — 2–4 sentences unless a longer answer is clearly needed. Do not use markdown formatting or bullet points unless specifically asked.`
