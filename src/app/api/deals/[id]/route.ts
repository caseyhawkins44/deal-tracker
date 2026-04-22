import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"
import { parseDealNumbers } from "@/lib/validateDealFields"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: { addedBy: { select: { name: true, email: true } } },
    })
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(deal)
  } catch (e) {
    console.error("GET /api/deals/[id]", e)
    return NextResponse.json({ error: "Failed to load deal" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    const [before, me] = await Promise.all([
      prisma.deal.findUnique({ where: { id }, select: { status: true, addedById: true } }),
      prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } }),
    ])

    if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (before.addedById !== session.user.id && me?.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const nums = parseDealNumbers(body)
    if ("error" in nums) return NextResponse.json({ error: nums.error }, { status: nums.status })

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        name: String(body.name).trim(),
        address: String(body.address).trim(),
        city: String(body.city).trim(),
        state: String(body.state).trim(),
        zipCode: String(body.zipCode ?? "").trim(),
        propertyType: body.propertyType,
        status: body.status,
        zillowUrl: body.zillowUrl || null,
        ...nums,
        notes: body.notes || null,
        projectId: body.projectId || null,
      },
    })

    if (before.status !== body.status) {
      await logActivity({
        dealId: id,
        userId: session.user.id,
        action: "STATUS_CHANGED",
        description: `${session.user.name ?? session.user.email} changed status from "${before?.status}" to "${body.status}"`,
      })
    } else {
      await logActivity({
        dealId: id,
        userId: session.user.id,
        action: "FINANCIALS_EDITED",
        description: `${session.user.name ?? session.user.email} updated deal details`,
      })
    }

    return NextResponse.json(deal)
  } catch (e) {
    console.error("PUT /api/deals/[id]", e)
    return NextResponse.json({ error: "Failed to update deal" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const { projectId } = await req.json()

    // Validate project exists if one is being assigned
    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } })
      if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const deal = await prisma.deal.update({
      where: { id },
      data: { projectId: projectId ?? null },
    })
    return NextResponse.json(deal)
  } catch (e) {
    console.error("PATCH /api/deals/[id]", e)
    return NextResponse.json({ error: "Failed to update deal" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const [deal, me] = await Promise.all([
      prisma.deal.findUnique({ where: { id }, select: { addedById: true } }),
      prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } }),
    ])
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (deal.addedById !== session.user.id && me?.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    await logActivity({
      dealId: id,
      userId: session.user.id,
      action: "DEAL_DELETED",
      description: `${session.user.name ?? session.user.email} deleted this deal`,
    })
    await prisma.deal.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("DELETE /api/deals/[id]", e)
    return NextResponse.json({ error: "Failed to delete deal" }, { status: 500 })
  }
}
