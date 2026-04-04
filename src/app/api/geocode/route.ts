import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json(null, { status: 401 })

  const q = req.nextUrl.searchParams.get("q") ?? ""
  if (!q) return NextResponse.json(null, { status: 400 })

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=us`

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "DealTracker/1.0 (real-estate deal analysis app)" },
    })
    const results = await res.json()
    if (!results.length) return NextResponse.json(null, { status: 404 })
    const { lat, lon } = results[0]
    return NextResponse.json({ lat: parseFloat(lat), lng: parseFloat(lon) })
  } catch {
    return NextResponse.json(null, { status: 500 })
  }
}
