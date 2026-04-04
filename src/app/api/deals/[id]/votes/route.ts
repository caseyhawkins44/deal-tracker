import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const votes = await prisma.vote.findMany({
      where: { dealId: id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    })
    return NextResponse.json(votes)
  } catch (e) {
    console.error("GET /api/deals/[id]/votes", e)
    return NextResponse.json({ error: "Failed to load votes" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const { vote, note } = body

    if (!["GO", "NO_GO", "NEED_MORE_INFO"].includes(vote))
      return NextResponse.json({ error: "Invalid vote" }, { status: 400 })
    if (!note || note.trim().length < 10)
      return NextResponse.json({ error: "Note must be at least 10 characters" }, { status: 400 })

    const existing = await prisma.vote.findUnique({
      where: { dealId_userId: { dealId: id, userId: session.user.id } },
    })

    const result = await prisma.vote.upsert({
      where: { dealId_userId: { dealId: id, userId: session.user.id } },
      create: { dealId: id, userId: session.user.id, vote, note: note.trim() },
      update: { vote, note: note.trim() },
      include: { user: { select: { name: true, email: true } } },
    })

    const voteLabel = vote === "GO" ? "Go" : vote === "NO_GO" ? "No-Go" : "Need More Info"
    await logActivity({
      dealId: id,
      userId: session.user.id,
      action: existing ? "VOTE_CHANGED" : "VOTE_CAST",
      description: `${session.user.name ?? session.user.email} voted "${voteLabel}"`,
    })

    return NextResponse.json(result, { status: existing ? 200 : 201 })
  } catch (e) {
    console.error("POST /api/deals/[id]/votes", e)
    return NextResponse.json({ error: "Failed to save vote" }, { status: 500 })
  }
}
