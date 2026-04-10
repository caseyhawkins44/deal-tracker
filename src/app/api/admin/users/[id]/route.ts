import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { requireAdmin } from "@/lib/admin"

// PATCH: update role or reset password
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!(await requireAdmin(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  try {
    const data: { role?: string; password?: string } = {}

    if (body.role !== undefined) {
      if (!["admin", "partner"].includes(body.role))
        return NextResponse.json({ error: "Invalid role" }, { status: 400 })
      if (id === session.user.id && body.role !== "admin")
        return NextResponse.json({ error: "Cannot remove your own admin role" }, { status: 400 })
      data.role = body.role
    }

    if (body.newPassword !== undefined) {
      if (typeof body.newPassword !== "string" || body.newPassword.length < 8)
        return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
      data.password = await bcrypt.hash(body.newPassword, 12)
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { deals: true } } },
    })

    return NextResponse.json(updated)
  } catch (e) {
    console.error("PATCH /api/admin/users/[id]", e)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

// DELETE: remove user account
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!(await requireAdmin(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  if (id === session.user.id)
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })

  try {
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("DELETE /api/admin/users/[id]", e)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
