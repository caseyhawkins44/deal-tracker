"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { analyzeDeal, fmt, fmtPct } from "@/lib/calculations"
import type { SerializedDeal } from "./DealsView"

type GeocodedDeal = SerializedDeal & { lat: number; lng: number }

function FitBounds({ deals }: { deals: GeocodedDeal[] }) {
  const map = useMap()
  useEffect(() => {
    if (!deals.length) return
    const bounds = L.latLngBounds(deals.map((d) => [d.lat, d.lng]))
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 })
  }, [deals, map])
  return null
}

export default function DealsMap({ deals }: { deals: SerializedDeal[] }) {
  const [geocoded, setGeocoded] = useState<GeocodedDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function geocodeAll() {
      const results: GeocodedDeal[] = []
      let failCount = 0

      await Promise.all(
        deals.map(async (deal) => {
          const q = `${deal.address}, ${deal.city}, ${deal.state} ${deal.zipCode}`
          try {
            const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`)
            if (res.ok) {
              const data = await res.json()
              if (data) results.push({ ...deal, lat: data.lat, lng: data.lng })
              else failCount++
            } else {
              failCount++
            }
          } catch {
            failCount++
          }
        })
      )

      if (!cancelled) {
        setGeocoded(results)
        setFailed(failCount)
        setLoading(false)
      }
    }

    geocodeAll()
    return () => { cancelled = true }
  }, [deals])

  return (
    <div className="relative rounded-[18px] overflow-hidden border border-black/[0.07] shadow-sm" style={{ height: 520 }}>
      {loading && (
        <div className="absolute inset-0 bg-white/80 z-[1000] flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Locating {deals.length} deal{deals.length !== 1 ? "s" : ""}…</p>
        </div>
      )}
      <MapContainer
        center={[39.5, -98.35]}
        zoom={4}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geocoded.map((deal) => {
          const m = analyzeDeal(deal)
          const positive = m.monthlyCashFlow >= 0
          return (
            <CircleMarker
              key={deal.id}
              center={[deal.lat, deal.lng]}
              radius={11}
              pathOptions={{
                color: positive ? "#16a34a" : "#dc2626",
                fillColor: positive ? "#22c55e" : "#f87171",
                fillOpacity: 0.85,
                weight: 2,
              }}
            >
              <Popup minWidth={200}>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900 mb-0.5">{deal.name}</p>
                  <p className="text-gray-400 text-xs mb-2">{deal.address}, {deal.city}, {deal.state}</p>
                  <p className="font-bold text-gray-800 mb-2">{fmt(deal.purchasePrice)}</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mb-3">
                    <span className="text-gray-500">Cash Flow/mo</span>
                    <span className={`font-semibold ${positive ? "text-green-600" : "text-red-500"}`}>
                      {fmt(m.monthlyCashFlow)}
                    </span>
                    <span className="text-gray-500">Cap Rate</span>
                    <span className="font-semibold">{fmtPct(m.capRate)}</span>
                    <span className="text-gray-500">Cash-on-Cash</span>
                    <span className="font-semibold">{fmtPct(m.cashOnCash)}</span>
                    <span className="text-gray-500">Gross Yield</span>
                    <span className="font-semibold">{fmtPct(m.grossYield)}</span>
                  </div>
                  <a
                    href={`/deals/${deal.id}`}
                    className="text-[#0071e3] text-xs hover:underline"
                  >
                    View full details →
                  </a>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
        {geocoded.length > 0 && <FitBounds deals={geocoded} />}
      </MapContainer>
      {!loading && failed > 0 && (
        <p className="absolute bottom-3 right-3 bg-white/90 text-xs text-gray-500 px-2 py-1 rounded-md z-[1000] border border-gray-200">
          {failed} address{failed !== 1 ? "es" : ""} could not be located
        </p>
      )}
    </div>
  )
}
