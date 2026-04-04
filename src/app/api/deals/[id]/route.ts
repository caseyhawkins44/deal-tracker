import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        name: body.name,
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        propertyType: body.propertyType,
        status: body.status,
        zillowUrl: body.zillowUrl || null,
        purchasePrice: Number(body.purchasePrice),
        downPaymentPct: Number(body.downPaymentPct),
        closingCosts: Number(body.closingCosts),
        rehabCosts: Number(body.rehabCosts),
        monthlyRent: Number(body.monthlyRent),
        propertyTax: Number(body.propertyTax),
        insurance: Number(body.insurance),
        maintenance: Number(body.maintenance),
        utilities: Number(body.utilities),
        hoaFees: Number(body.hoaFees),
        interestRate: Number(body.interestRate),
        loanTermYears: Number(body.loanTermYears),
        vacancyRate: Number(body.vacancyRate),
        managementFee: Number(body.managementFee),
        notes: body.notes || null,
      },
    })

    return NextResponse.json(deal)
  } catch (e) {
    console.error("PUT /api/deals/[id]", e)
    return NextResponse.json({ error: "Failed to update deal" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    await prisma.deal.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("DELETE /api/deals/[id]", e)
    return NextResponse.json({ error: "Failed to delete deal" }, { status: 500 })
  }
}
