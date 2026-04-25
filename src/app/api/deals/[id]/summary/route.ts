import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildDealContext, DEAL_ANALYST_SYSTEM_PROMPT } from "@/lib/dealContext"

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

    // Rate limit: one summary request per deal per 5 minutes
    const recentRequest = await prisma.activityLog.findFirst({
      where: {
        dealId: id,
        action: "AI_SUMMARY_REQUESTED",
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
      },
    })
    if (recentRequest) {
      return NextResponse.json({ error: "Summary generated recently. Please wait a few minutes." }, { status: 429 })
    }

    await prisma.activityLog.create({
      data: {
        dealId: id,
        userId: session.user.id,
        action: "AI_SUMMARY_REQUESTED",
        description: `${session.user.name ?? session.user.email} generated an AI summary`,
      },
    })

    const dealContext = buildDealContext(deal, criteriaRow)

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
        system: DEAL_ANALYST_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Here is the deal data:\n\n${dealContext}\n\nProvide a concise analyst summary of this deal in 4–6 sentences. Plain prose, no bullet points, no markdown.`,
          },
        ],
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
