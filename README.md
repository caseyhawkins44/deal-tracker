# Deal Tracker

A private web app for real estate investment partners to track, analyze, and compare prospective deals.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Supabase — connection pooling (used by the app at runtime)
DATABASE_URL="postgresql://..."

# Supabase — direct connection (used for migrations only)
DIRECT_URL="postgresql://..."

# NextAuth
AUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Anthropic (optional)
# Enables the AI Deal Summary feature on each deal detail page.
# Obtain your key from https://console.anthropic.com
# If this variable is not set, the AI summary feature is hidden gracefully —
# all other functionality works normally.
ANTHROPIC_API_KEY="sk-ant-..."
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 7 |
| Auth | NextAuth v5 (beta) |
| Maps | Leaflet + react-leaflet |
| AI | Anthropic Claude Haiku (optional) |

## Build

```bash
npm run build   # runs prisma generate && next build
npm start
```
