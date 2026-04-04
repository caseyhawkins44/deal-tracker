"use client"

// The bookmarklet runs on the Zillow page in the user's browser.
// It reads Zillow's embedded __NEXT_DATA__ JSON (already on the page — no fetch needed,
// so bot detection is irrelevant), extracts the listing details, encodes them as
// base64 JSON, and opens your Deal Tracker app with the data pre-filled.
// Tiny loader — the real logic lives at /bookmarklet-script so it can be updated
// without the user needing to re-drag the bookmark.
export default function BookmarkletInstaller() {
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const BOOKMARKLET_CODE = `javascript:(function(){var s=document.createElement('script');s.src='${origin}/bookmarklet-script?_='+Date.now();document.head.appendChild(s);})();`
  return (
    <div className="space-y-6">
      {/* The draggable bookmarklet */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <p className="text-sm font-medium text-gray-700 mb-4">
          Step 1 — Drag this button to your bookmarks bar:
        </p>
        <div className="flex items-center gap-4">
          {/* dangerouslySetInnerHTML is required here — React blocks javascript: hrefs as a
              security policy, but bookmarklets need exactly that. This is safe because
              BOOKMARKLET_CODE is a hardcoded constant defined in this file, not user input. */}
          <span
            dangerouslySetInnerHTML={{
              __html: `<a
                href="${BOOKMARKLET_CODE.replace(/"/g, "&quot;")}"
                draggable="true"
                style="display:inline-flex;align-items:center;gap:8px;background:#2563eb;color:#fff;padding:10px 20px;border-radius:12px;font-weight:500;font-size:14px;cursor:grab;text-decoration:none;user-select:none;box-shadow:0 1px 2px rgba(0,0,0,.1)"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
                Add to Deal Tracker
              </a>`,
            }}
          />
          <p className="text-sm text-gray-400">← drag this to your bookmarks bar</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <p className="text-sm font-medium text-gray-700 mb-4">Step 2 — How to use it:</p>
        <ol className="space-y-3">
          {[
            "Go to any Zillow property listing page in your browser",
            'Click "Add to Deal Tracker" in your bookmarks bar',
            "Deal Tracker opens pre-filled with the property details",
            "Review the numbers, fill in the remaining fields (down payment, rate, etc.), and save",
          ].map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-600">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* What gets imported */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <p className="text-sm font-medium text-gray-700 mb-3">What gets imported automatically:</p>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
          {[
            "Property address",
            "City, state, ZIP",
            "Listing price",
            "Property type",
            "HOA fees",
            "Property tax (monthly)",
            "Rent Zestimate",
            "Deal name",
          ].map(item => (
            <div key={item} className="flex items-center gap-2">
              <svg className="text-green-500 flex-shrink-0" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">
          You&apos;ll still need to enter: down payment %, interest rate, insurance, maintenance, and utilities.
        </p>
      </div>

      {/* Show bookmarks bar tip */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        <strong>Bookmarks bar not visible?</strong> In Chrome: View → Show Bookmarks Bar (or Cmd+Shift+B). In Safari: View → Show Favorites Bar.
      </div>
    </div>
  )
}
