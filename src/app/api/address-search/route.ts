import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

type NominatimResult = {
  display_name: string
  address: {
    house_number?: string
    road?: string
    city?: string
    town?: string
    village?: string
    postcode?: string
    "ISO3166-2-lvl4"?: string
  }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json([], { status: 401 })

  const q = req.nextUrl.searchParams.get("q") ?? ""
  if (q.length < 4 || q.length > 200) return NextResponse.json([])

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&countrycodes=us&limit=6`

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "DealTracker/1.0 (real-estate deal analysis app)" },
    })
    const results: NominatimResult[] = await res.json()

    const suggestions = results
      .map(r => {
        const addr = r.address
        const street = [addr.house_number, addr.road].filter(Boolean).join(" ")
        const city = addr.city || addr.town || addr.village || ""
        const state = addr["ISO3166-2-lvl4"]?.split("-")[1] ?? ""
        const zipCode = addr.postcode ?? ""
        if (!street || !city) return null
        return { display: `${street}, ${city}, ${state} ${zipCode}`, street, city, state, zipCode }
      })
      .filter(Boolean)

    return NextResponse.json(suggestions)
  } catch {
    return NextResponse.json([])
  }
}
