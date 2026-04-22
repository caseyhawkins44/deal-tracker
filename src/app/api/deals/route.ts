import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"
import { parseDealNumbers } from "@/lib/validateDealFields"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const deals = await prisma.deal.findMany({
      include: { addedBy: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(deals)
  } catch (e) {
    console.error("GET /api/deals", e)
    return NextResponse.json({ error: "Failed to load deals" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()

    if (!body.name || !body.address || !body.city || !body.state) {
      return NextResponse.json({ error: "name, address, city, and state are required" }, { status: 400 })
    }

    const nums = parseDealNumbers(body)
    if ("error" in nums) return NextResponse.json({ error: nums.error }, { status: nums.status })

    const deal = await prisma.deal.create({
      data: {
        name: String(body.name).trim(),
        address: String(body.address).trim(),
        city: String(body.city).trim(),
        state: String(body.state).trim(),
        zipCode: String(body.zipCode ?? "").trim(),
        propertyType: body.propertyType ?? "Single Family",
        status: body.status ?? "Prospecting",
        zillowUrl: body.zillowUrl || null,
        ...nums,
        notes: body.notes || null,
        projectId: body.projectId || null,
        addedById: session.user.id,
      },
    })

    await logActivity({
      dealId: deal.id,
      userId: session.user.id,
      action: "DEAL_CREATED",
      description: `${session.user.name ?? session.user.email} added this deal`,
    })

    return NextResponse.json(deal, { status: 201 })
  } catch (e) {
    console.error("POST /api/deals", e)
    return NextResponse.json({ error: "Failed to save deal" }, { status: 500 })
  }
}
