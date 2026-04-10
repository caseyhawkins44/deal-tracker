import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const comments = await prisma.comment.findMany({
      where: { dealId: id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    })
    return NextResponse.json(comments)
  } catch (e) {
    console.error("GET /api/deals/[id]/comments", e)
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const body_text = (body.body ?? "").trim()
    if (!body_text) return NextResponse.json({ error: "Comment body is required" }, { status: 400 })
    if (body_text.length > 2000) return NextResponse.json({ error: "Comment must be 2000 characters or fewer" }, { status: 400 })

    const comment = await prisma.comment.create({
      data: { body: body_text, dealId: id, userId: session.user.id },
      include: { user: { select: { name: true, email: true } } },
    })

    await logActivity({
      dealId: id,
      userId: session.user.id,
      action: "COMMENT_ADDED",
      description: `${session.user.name ?? session.user.email} posted a comment`,
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (e) {
    console.error("POST /api/deals/[id]/comments", e)
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 })
  }
}
