"use client"

import dynamic from "next/dynamic"
import type { SerializedDeal } from "./DealsView"

const DealsMap = dynamic(() => import("./DealsMap"), {
  ssr: false,
  loading: () => (
    <div
      className="rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center"
      style={{ height: 520 }}
    >
      <p className="text-sm text-gray-400">Loading map…</p>
    </div>
  ),
})

export default function DealsMapClient({ deals }: { deals: SerializedDeal[] }) {
  return <DealsMap deals={deals} />
}
