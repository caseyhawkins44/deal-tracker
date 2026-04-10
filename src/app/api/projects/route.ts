import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { deals: true } } },
    })
    return NextResponse.json(projects)
  } catch (e) {
    console.error("GET /api/projects", e)
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { name } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 })

    const project = await prisma.project.create({ data: { name: name.trim() } })
    return NextResponse.json(project, { status: 201 })
  } catch (e) {
    console.error("POST /api/projects", e)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
