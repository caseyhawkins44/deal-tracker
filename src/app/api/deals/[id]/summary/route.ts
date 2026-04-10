import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { analyzeDeal } from "@/lib/calculations"
import { DEFAULT_CRITERIA } from "@/lib/criteria"

function meets(value: number, target: number, higherIsBetter = true): string {
  return (higherIsBetter ? value >= target : value <= target) ? "MEETS" : "MISSES"
}

function dollar(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}

function pct(n: number): string {
  return n.toFixed(2) + "%"
}

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: "AI_UNAVAILABLE" }, { status: 503 })

  try {
    const { id } = await params
    const [deal, criteriaRow] = await Promise.all([
      prisma.deal.findUnique({ where: { id } }),
      prisma.investmentCriteria.findUnique({ where: { id: "singleton" } }),
    ])

    if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 })

    const m = analyzeDeal(deal)
    const c = criteriaRow ?? DEFAULT_CRITERIA

    const totalCashNeeded = m.downPayment + deal.closingCosts + deal.rehabCosts

    const userMessage = `Analyze this real estate deal:

PROPERTY: ${deal.address}, ${deal.city} ${deal.state} ${deal.zipCode}
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

TEAM INVESTMENT CRITERIA:
Minimum cap rate: ${pct(c.minCapRate)}
Minimum cash-on-cash return: ${pct(c.minCashOnCash)}
Minimum monthly cash flow: ${dollar(c.minMonthlyCashFlow)}
Minimum DSCR: ${c.minDscr}x
Maximum GRM: ${c.maxGrm}x

CRITERIA CHECK:
Cap rate: ${meets(m.capRate, c.minCapRate)} target (${pct(m.capRate)} vs ${pct(c.minCapRate)} minimum)
Cash-on-cash: ${meets(m.cashOnCash, c.minCashOnCash)} target (${pct(m.cashOnCash)} vs ${pct(c.minCashOnCash)} minimum)
Monthly cash flow: ${meets(m.monthlyCashFlow, c.minMonthlyCashFlow)} target (${dollar(m.monthlyCashFlow)} vs ${dollar(c.minMonthlyCashFlow)} minimum)${deal.notes?.trim() ? `\n\nDEAL NOTES:\n${deal.notes.trim()}` : ""}

Provide a concise analyst summary of this deal.`

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 400,
        system:
          "You are a concise real estate investment analyst. When given deal data, you write a single paragraph (4-6 sentences) that summarizes the property, evaluates its financial performance against the team's investment criteria, and flags anything notable. Be direct and data-driven. Do not use bullet points. Do not use markdown formatting. Write in plain prose as if briefing a partner who has 30 seconds to read it.",
        messages: [{ role: "user", content: userMessage }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("Anthropic API error:", response.status, err)
      return NextResponse.json({ error: "Failed to generate summary" }, { status: 502 })
    }

    const data = await response.json()
    const summary = data.content?.[0]?.text ?? ""

    return NextResponse.json({ summary })
  } catch (e) {
    console.error("POST /api/deals/[id]/summary", e)
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 })
  }
}
