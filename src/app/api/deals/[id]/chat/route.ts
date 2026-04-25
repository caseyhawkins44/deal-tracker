import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildDealContext, DEAL_ANALYST_SYSTEM_PROMPT } from "@/lib/dealContext"

type Message = { role: "user" | "assistant"; content: string }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: "AI_UNAVAILABLE" }, { status: 503 })

  try {
    const { id } = await params
    const body = await req.json()
    const history: Message[] = Array.isArray(body.messages) ? body.messages : []
    const question: string = typeof body.question === "string" ? body.question.trim() : ""

    if (!question) return NextResponse.json({ error: "Question is required" }, { status: 400 })
    if (history.length > 40) return NextResponse.json({ error: "Conversation too long" }, { status: 400 })

    const [deal, criteriaRow] = await Promise.all([
      prisma.deal.findUnique({ where: { id } }),
      prisma.investmentCriteria.findUnique({ where: { id: "singleton" } }),
    ])

    if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 })

    const dealContext = buildDealContext(deal, criteriaRow)

    // Prepend deal context as the first user turn so it's always in scope
    const messages: Message[] = [
      { role: "user", content: `Here is the deal data:\n\n${dealContext}` },
      { role: "assistant", content: "Got it. I have the full deal data. What would you like to know?" },
      ...history,
      { role: "user", content: question },
    ]

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 500,
        system: DEAL_ANALYST_SYSTEM_PROMPT,
        messages,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("Anthropic chat error:", response.status, err)
      return NextResponse.json({ error: "Failed to get answer" }, { status: 502 })
    }

    const data = await response.json()
    const answer = data.content?.[0]?.text ?? ""
    return NextResponse.json({ answer })
  } catch (e) {
    console.error("POST /api/deals/[id]/chat", e)
    return NextResponse.json({ error: "Failed to get answer" }, { status: 500 })
  }
}
