import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"

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

    const deal = await prisma.deal.create({
      data: {
        name: body.name,
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        propertyType: body.propertyType ?? "Single Family",
        status: body.status ?? "Prospecting",
        zillowUrl: body.zillowUrl || null,
        purchasePrice: Number(body.purchasePrice),
        downPaymentPct: Number(body.downPaymentPct ?? 20),
        closingCosts: Number(body.closingCosts ?? 0),
        rehabCosts: Number(body.rehabCosts ?? 0),
        monthlyRent: Number(body.monthlyRent),
        propertyTax: Number(body.propertyTax ?? 0),
        insurance: Number(body.insurance ?? 0),
        maintenance: Number(body.maintenance ?? 0),
        utilities: Number(body.utilities ?? 0),
        hoaFees: Number(body.hoaFees ?? 0),
        interestRate: Number(body.interestRate ?? 7),
        loanTermYears: Number(body.loanTermYears ?? 30),
        vacancyRate: Number(body.vacancyRate ?? 5),
        managementFee: Number(body.managementFee ?? 0),
        notes: body.notes || null,
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
