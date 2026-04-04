import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const activity = await prisma.activityLog.findMany({
      where: { dealId: id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(activity)
  } catch (e) {
    console.error("GET /api/deals/[id]/activity", e)
    return NextResponse.json({ error: "Failed to load activity" }, { status: 500 })
  }
}
