# Ledger Line

Chat with an AI bookkeeper that logs your spending, sorts it into categories, and keeps a running ledger.

- **Talk to it** — "coffee with a client, 4.50" or "taxi to the office, 18" — it logs the entry, infers a category, and confirms the running total.
- **Ask it questions** — "how much have I spent this month?" pulls a real breakdown instead of guessing.
- **Undo mistakes** — say "undo that" or use the sidebar's Void last button.
- A live ledger sidebar always shows the true numbers straight from the database.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · [Vercel AI SDK](https://ai-sdk.dev) with tool calling · Claude (Anthropic API) · Postgres (via Drizzle ORM + Neon's serverless driver)

Postgres rather than a local file because the app is meant to run on Vercel, where serverless functions have no persistent disk.

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` with two values:

- `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com/settings/keys)
- `DATABASE_URL` — a Postgres connection string (see **Database** below for the easiest way to get one)

Then create the tables and start the dev server:

```bash
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

Any Postgres connection string works, but the path of least resistance is Neon, since Vercel provisions it for you with zero separate signup:

1. In the Vercel dashboard, open your project's **Storage** tab → **Create Database** → **Postgres**.
2. Pull the connection string down locally: `vercel env pull .env.local` (requires `vercel link` first — see **Deploying** below).
3. Run `npm run db:push` to create the tables from `lib/db/schema.ts`.

The same database can be used for both local development and production — it's a real hosted Postgres instance either way.

## Deploying (Vercel)

```bash
npm i -g vercel   # if you don't have it
vercel login
vercel link       # connects this folder to a Vercel project
```

Then, in the Vercel dashboard for that project:

1. **Storage** tab → add a Postgres database (auto-sets `DATABASE_URL` for the deployed app).
2. **Settings → Environment Variables** → add `ANTHROPIC_API_KEY`.

Pull those down locally and push the schema once:

```bash
vercel env pull .env.local
npm run db:push
```

Ship it:

```bash
vercel --prod
```

That prints a public URL — that's what you share.

## Project structure

```
app/
  page.tsx              server component — loads initial ledger + chat history from Postgres
  api/chat/route.ts     streaming chat endpoint; the model calls tools to read/write the ledger
  api/ledger/route.ts   REST endpoint the sidebar uses to refresh, change currency, void an entry
components/
  LedgerApp.tsx          page layout: masthead, currency picker, two-pane grid
  ChatPanel.tsx          chat UI (useChat)
  LedgerSidebar.tsx      running totals, category breakdown, recent entries
lib/
  ledger.ts              shared types, categories, currency formatting, summary math
  db/                    Drizzle schema, Postgres client, query helpers
```
