import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const HOME_TYPE_MAP: Record<string, string> = {
  SINGLE_FAMILY: "Single Family",
  MULTI_FAMILY: "Multi Family",
  CONDO: "Condo",
  TOWNHOUSE: "Townhouse",
  MANUFACTURED: "Single Family",
  MOBILE: "Single Family",
  LOT: "Land",
  LAND: "Land",
  APARTMENT: "Multi Family",
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { url } = await req.json()
  if (!url || !url.includes("zillow.com")) {
    return NextResponse.json({ error: "Invalid Zillow URL" }, { status: 400 })
  }

  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) return NextResponse.json({ error: "RAPIDAPI_KEY not configured" }, { status: 500 })

  const res = await fetch(
    `https://private-zillow.p.rapidapi.com/pro/byurl?url=${encodeURIComponent(url)}`,
    {
      headers: {
        "x-rapidapi-host": "private-zillow.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
      },
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: "Zillow API request failed" }, { status: 502 })
  }

  const data = await res.json()
  const details = data.propertyDetails

  if (!details) {
    return NextResponse.json({ error: "No property data returned from Zillow" }, { status: 422 })
  }

  const streetAddress = details.streetAddress ?? details.address?.streetAddress ?? ""
  const city = details.city ?? details.address?.city ?? ""
  const state = details.state ?? details.address?.state ?? ""
  const zipCode = details.zipcode ?? details.address?.zipcode ?? ""

  const purchasePrice = details.price ?? 0
  const propertyType = HOME_TYPE_MAP[details.homeType ?? ""] ?? "Single Family"
  const propertyTax = details.resoFacts?.taxAnnualAmount ?? 0  // annual, matches form field
  const hoaFees = details.resoFacts?.hoaFee ?? details.resoFacts?.associationFee ?? 0

  const name = streetAddress ? `${streetAddress}, ${city}` : "New Deal"

  return NextResponse.json({
    name,
    address: streetAddress,
    city,
    state,
    zipCode,
    propertyType,
    purchasePrice,
    propertyTax,
    hoaFees,
    zillowUrl: url,
  })
}
