import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const { name, email, password, inviteCode } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 })
  }

  // Check invite code requirement
  const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } })
  if (settings?.inviteCode) {
    if (!inviteCode || inviteCode.trim() !== settings.inviteCode) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 403 })
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
  })

  return NextResponse.json({ id: user.id, email: user.email })
}
