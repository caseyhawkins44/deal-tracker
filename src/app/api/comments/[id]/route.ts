import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const comment = await prisma.comment.findUnique({ where: { id } })
    if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (comment.userId !== session.user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    await prisma.comment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("DELETE /api/comments/[id]", e)
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 })
  }
}
