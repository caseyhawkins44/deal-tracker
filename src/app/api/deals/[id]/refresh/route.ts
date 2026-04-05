import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/activity"

const HOME_TYPE_MAP: Record<string, string> = {
  SINGLE_FAMILY: "Single Family",
  MULTI_FAMILY: "Multi Family",
  CONDO: "Condo",
  TOWNHOUSE: "Townhouse",
  MANUFACTURED: "Manufactured",
  LOT: "Lot",
  APARTMENT: "Apartment",
}

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const deal = await prisma.deal.findUnique({ where: { id } })
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!deal.zillowUrl) return NextResponse.json({ error: "No Zillow URL on this deal" }, { status: 400 })

  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) return NextResponse.json({ error: "RAPIDAPI_KEY not configured" }, { status: 500 })

  const zillowRes = await fetch(
    `https://private-zillow.p.rapidapi.com/pro/byurl?url=${encodeURIComponent(deal.zillowUrl)}`,
    {
      headers: {
        "x-rapidapi-host": "private-zillow.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
    }
  )

  if (!zillowRes.ok) {
    return NextResponse.json({ error: "Zillow API request failed" }, { status: 502 })
  }

  const data = await zillowRes.json()
  const details = data.propertyDetails

  if (!details) {
    return NextResponse.json({ error: "No property data returned" }, { status: 502 })
  }

  const updates: {
    purchasePrice?: number
    propertyTax?: number
    propertyType?: string
  } = {}

  const changes: string[] = []

  if (typeof details.price === "number" && details.price !== deal.purchasePrice) {
    updates.purchasePrice = details.price
    changes.push(`price $${deal.purchasePrice.toLocaleString()} → $${details.price.toLocaleString()}`)
  }

  const taxAnnual = details.resoFacts?.taxAnnualAmount
  if (typeof taxAnnual === "number" && taxAnnual !== deal.propertyTax) {
    updates.propertyTax = taxAnnual
    changes.push(`property tax $${deal.propertyTax.toLocaleString()}/yr → $${taxAnnual.toLocaleString()}/yr`)
  }

  const rawType = details.homeType as string | undefined
  const mappedType = rawType ? (HOME_TYPE_MAP[rawType] ?? rawType) : undefined
  if (mappedType && mappedType !== deal.propertyType) {
    updates.propertyType = mappedType
    changes.push(`type "${deal.propertyType}" → "${mappedType}"`)
  }

  if (Object.keys(updates).length > 0) {
    await prisma.deal.update({ where: { id }, data: updates })
    await logActivity({
      dealId: id,
      userId: session.user.id,
      action: "FINANCIALS_EDITED",
      description: `${session.user.name ?? session.user.email} refreshed from Zillow: ${changes.join(", ")}`,
    })
  }

  return NextResponse.json({
    updated: Object.keys(updates).length > 0,
    changes,
    priceChange: details.priceChange ?? null,
    priceChangeDate: details.priceChangeDate ?? null,
    homeStatus: details.homeStatus ?? null,
    daysOnZillow: details.cumulativeDaysOnMarket ?? null,
  })
}
