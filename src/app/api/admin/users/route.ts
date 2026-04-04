import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  if (me?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { deals: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(users)
}
