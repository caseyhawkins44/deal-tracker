import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const comment = await prisma.comment.findUnique({ where: { id } })
    if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const updated = await prisma.comment.update({
      where: { id },
      data: { isFlagged: !comment.isFlagged },
    })
    return NextResponse.json(updated)
  } catch (e) {
    console.error("PATCH /api/comments/[id]/flag", e)
    return NextResponse.json({ error: "Failed to toggle flag" }, { status: 500 })
  }
}
