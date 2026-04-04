import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { url } = await req.json()
  if (!url || !url.includes("zillow.com")) {
    return NextResponse.json({ error: "Invalid Zillow URL" }, { status: 400 })
  }

  let html: string
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Upgrade-Insecure-Requests": "1",
      },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: "Zillow blocked the request. Please fill in the details manually." },
        { status: 422 }
      )
    }

    html = await res.text()
  } catch {
    return NextResponse.json(
      { error: "Could not reach Zillow. Check your internet connection." },
      { status: 422 }
    )
  }

  // Zillow embeds all listing data in a __NEXT_DATA__ script tag
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
  if (!match) {
    return NextResponse.json(
      { error: "Could not find listing data. Zillow may have blocked this request." },
      { status: 422 }
    )
  }

  let listing: Record<string, unknown> | null = null
  try {
    const nextData = JSON.parse(match[1])

    // Try multiple known locations in Zillow's data structure
    const props = nextData?.props?.pageProps

    // Path 1: gdpClientCache (most common)
    if (props?.componentProps?.gdpClientCache) {
      const cache = JSON.parse(props.componentProps.gdpClientCache)
      const zpid = Object.keys(cache)[0]
      listing = cache[zpid]?.property ?? null
    }

    // Path 2: initialData
    if (!listing && props?.initialData?.building) {
      listing = props.initialData.building
    }

    // Path 3: initialReduxState
    if (!listing && nextData?.props?.initialReduxState?.gdp?.fullPage?.gdpClientCache) {
      const cache = JSON.parse(nextData.props.initialReduxState.gdp.fullPage.gdpClientCache)
      const zpid = Object.keys(cache)[0]
      listing = cache[zpid]?.property ?? null
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to parse Zillow listing data." },
      { status: 422 }
    )
  }

  if (!listing) {
    return NextResponse.json(
      { error: "Could not extract listing details. Zillow may have changed their page format." },
      { status: 422 }
    )
  }

  // Map Zillow property types to our types
  const typeMap: Record<string, string> = {
    SINGLE_FAMILY: "Single Family",
    CONDO: "Condo",
    TOWNHOUSE: "Townhouse",
    MULTI_FAMILY: "Multi Family",
    APARTMENT: "Multi Family",
    LOT: "Land",
    LAND: "Land",
    MANUFACTURED: "Single Family",
    MOBILE: "Single Family",
  }

  const raw = listing as {
    price?: number
    address?: { streetAddress?: string; city?: string; state?: string; zipcode?: string }
    streetAddress?: string
    city?: string
    state?: string
    zipcode?: string
    homeType?: string
    monthlyHoaFee?: number
    rentZestimate?: number
    propertyTaxRate?: number // annual % of value
    resoFacts?: { taxAnnualAmount?: number; hoaFee?: number }
  }

  const address = raw.address ?? {}
  const streetAddress = raw.streetAddress ?? address.streetAddress ?? ""
  const city = raw.city ?? address.city ?? ""
  const state = raw.state ?? address.state ?? ""
  const zipcode = raw.zipcode ?? address.zipcode ?? ""
  const purchasePrice = raw.price ?? 0
  const propertyType = typeMap[raw.homeType ?? ""] ?? "Single Family"
  const hoaFees = raw.monthlyHoaFee ?? raw.resoFacts?.hoaFee ?? 0
  const rentEstimate = raw.rentZestimate ?? 0

  // Annual tax → monthly
  const annualTax =
    raw.resoFacts?.taxAnnualAmount ??
    (raw.propertyTaxRate && purchasePrice ? (raw.propertyTaxRate / 100) * purchasePrice : 0)
  const monthlyTax = Math.round(annualTax / 12)

  // Build a suggested deal name
  const name = streetAddress
    ? `${streetAddress}, ${city}`
    : "New Deal"

  return NextResponse.json({
    name,
    address: streetAddress,
    city,
    state,
    zipCode: zipcode,
    propertyType,
    purchasePrice,
    monthlyRent: rentEstimate,
    hoaFees,
    propertyTax: monthlyTax,
  })
}
