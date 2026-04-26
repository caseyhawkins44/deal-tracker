import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DEFAULT_CRITERIA } from "@/lib/criteria"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const criteria = await prisma.investmentCriteria.findUnique({ where: { id: "singleton" } })
    return NextResponse.json(criteria ?? { id: "singleton", ...DEFAULT_CRITERIA })
  } catch (e) {
    console.error("GET /api/settings", e)
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const data = {
      minCashOnCash: Number(body.minCashOnCash),
      minCapRate: Number(body.minCapRate),
      minDscr: Number(body.minDscr),
      maxGrm: Number(body.maxGrm),
      minMonthlyCashFlow: Number(body.minMonthlyCashFlow),
      ignoreCashOnCash: Boolean(body.ignoreCashOnCash),
      ignoreCapRate: Boolean(body.ignoreCapRate),
      ignoreDscr: Boolean(body.ignoreDscr),
      ignoreGrm: Boolean(body.ignoreGrm),
      ignoreCashFlow: Boolean(body.ignoreCashFlow),
    }
    const criteria = await prisma.investmentCriteria.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", ...data },
      update: data,
    })
    return NextResponse.json(criteria)
  } catch (e) {
    console.error("PUT /api/settings", e)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
