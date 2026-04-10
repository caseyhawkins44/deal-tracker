import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!(await requireAdmin(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } })
  return NextResponse.json({ inviteCode: settings?.inviteCode ?? null })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!(await requireAdmin(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const body = await req.json()
    // inviteCode: null or "" disables requirement; any non-empty string enables it
    const inviteCode = typeof body.inviteCode === "string" && body.inviteCode.trim()
      ? body.inviteCode.trim()
      : null

    const settings = await prisma.appSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", inviteCode },
      update: { inviteCode },
    })
    return NextResponse.json({ inviteCode: settings.inviteCode })
  } catch (e) {
    console.error("PUT /api/admin/settings", e)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
