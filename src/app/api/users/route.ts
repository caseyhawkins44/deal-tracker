import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Returns name + id for all users — used by @mention autocomplete
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json([], { status: 401 })

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(users)
}
