# Deal Tracker — Project Brief

## What This Is

A private web app for a small group of real estate investment partners to track, analyze, and compare prospective deals. It is live at **https://dealtracker-five.vercel.app**.

## Who Uses It

A few partners (Casey + others) who are evaluating real estate deals together. Each partner has their own login. There is no public-facing component — all pages require authentication.

## Core Features (already built)

### Deal Management
- Add, edit, and delete prospective deals
- Each deal stores: address, property type, status (Prospecting / Under Analysis / Offer Made / Passed), purchase price, down payment %, closing costs, rehab costs, monthly rent, property tax (annual), insurance, maintenance, utilities, HOA fees, interest rate, loan term, vacancy rate, management fee %, notes, and a Zillow URL
- All dollar fields use formatted `$1,234` inputs (no cents)

### Financial Analysis
For every deal the app automatically calculates:
- Monthly mortgage (P&I)
- Effective rent (after vacancy)
- Monthly operating expenses
- **Monthly & annual cash flow**
- **Cap rate**
- **Cash-on-cash return**
- **Gross yield**
- Gross rent multiplier (GRM)

These metrics are shown on the deal list, deal detail page, and comparison view.

### Deal Comparison
Side-by-side comparison of any two deals across all financial metrics.

### Zillow Bookmarklet
A draggable browser bookmark. On any Zillow property detail page, clicking it extracts the listing data (address, price, property type, HOA, tax, Rent Zestimate) from the page's embedded JSON and redirects to the app's "Add Deal" form with those fields pre-filled. The user only needs to fill in financing details (down payment, rate, etc.).

### Map View
The deals list page has a List / Map toggle. The map view geocodes all deal addresses and shows colored pins — green for positive cash flow, red for negative. Clicking a pin shows a popup with key metrics and a link to the full deal.

### Address Autocomplete
The deal form has autocomplete on the address field using OpenStreetMap/Nominatim (free, no API key). Selecting an address auto-fills city, state, and ZIP.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.2 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 7 (adapter pattern with `@prisma/adapter-pg`) |
| Auth | NextAuth v5 (beta) — Credentials provider, JWT strategy |
| Maps | Leaflet + react-leaflet (OpenStreetMap tiles) |
| Geocoding | Nominatim/OpenStreetMap (free, no API key) |
| Hosting | Vercel (auto-deploys from GitHub on push to `main`) |

## Key Architecture Notes

- **Prisma 7** uses an adapter pattern — the database URL lives in `prisma.config.ts`, not in `schema.prisma`. The generated client is at `src/generated/prisma/client` (not the default location). Build script runs `prisma generate && next build`.
- **Auth is split** into `auth.config.ts` (edge-safe, no DB imports, used by middleware) and `auth.ts` (full, with Prisma, used by API routes). This is required because Next.js middleware runs on the Edge runtime which cannot use Node.js built-ins.
- **Bookmarklet** embeds all extraction logic directly in the `javascript:` URL — no external script loading — because Zillow's Content Security Policy blocks external scripts.
- **Map component** uses `dynamic(() => import(...), { ssr: false })` inside a `"use client"` wrapper component to avoid SSR issues with Leaflet.
- **`propertyTax`** is stored as an annual value in the database and divided by 12 in `calculations.ts`.

## File Structure (key files)

```
src/
  app/
    deals/page.tsx          — deal list with List/Map toggle
    deals/new/page.tsx      — add deal form
    deals/[id]/page.tsx     — deal detail + metrics
    deals/[id]/edit/page.tsx
    compare/page.tsx        — side-by-side comparison
    bookmarklet/page.tsx    — bookmarklet install instructions
    api/
      deals/route.ts        — GET all, POST new
      deals/[id]/route.ts   — PUT, DELETE
      geocode/route.ts      — address → lat/lng via Nominatim
      address-search/route.ts — address autocomplete
      register/route.ts     — create account
  components/
    DealForm.tsx            — shared add/edit form
    DealsView.tsx           — list/map toggle + list cards
    DealsMap.tsx            — Leaflet map component
    DealsMapClient.tsx      — ssr:false wrapper for DealsMap
    CompareView.tsx         — side-by-side comparison UI
    BookmarkletInstaller.tsx — draggable bookmarklet button
    CurrencyInput.tsx       — $1,234 formatted input
    AddressSearch.tsx       — debounced autocomplete dropdown
    InfoTooltip.tsx         — hover tooltip with i button
    NavBar.tsx
  lib/
    calculations.ts         — all financial metric formulas
    auth.ts                 — full NextAuth config
    auth.config.ts          — edge-safe auth config (middleware only)
    prisma.ts               — Prisma client singleton
prisma/
  schema.prisma             — User, Account, Session, Deal models
prisma.config.ts            — datasource URL config for Prisma 7
```

## Environment Variables

```
DATABASE_URL      — Supabase pooler connection string (runtime)
DIRECT_URL        — Supabase direct connection string (migrations only)
AUTH_SECRET       — NextAuth secret
NEXTAUTH_URL      — Full URL of the app (e.g. https://dealtracker-five.vercel.app)
```

## What's Not Built Yet

- Email/password reset flow
- Deal status change history / activity log
- Photo uploads
- Mobile-optimized layout
- Push notifications or alerts (e.g. "partner added a deal")
- Export to CSV/PDF
