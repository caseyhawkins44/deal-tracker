import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { HOME_TYPE_MAP } from "@/lib/homeTypeMap"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { url } = await req.json()
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }
  if (!parsedUrl.hostname.endsWith("zillow.com")) {
    return NextResponse.json({ error: "URL must be a zillow.com listing" }, { status: 400 })
  }

  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) return NextResponse.json({ error: "Zillow import is not available" }, { status: 503 })

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
  const monthlyRent = details.resoFacts?.totalActualRent ?? 0

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
    monthlyRent,
    zillowUrl: url,
  })
}
