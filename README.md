# Ledger Line

Chat with an AI bookkeeper that logs your spending, sorts it into categories, and keeps a running ledger.

- **Talk to it** — "coffee with a client, 4.50" or "taxi to the office, 18" — it logs the entry, infers a category, and confirms the running total.
- **Ask it questions** — "how much have I spent this month?" pulls a real breakdown instead of guessing.
- **Undo mistakes** — say "undo that" or use the sidebar's Void last button.
- A live ledger sidebar always shows the true numbers straight from the database.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · [Vercel AI SDK](https://ai-sdk.dev) with tool calling · Claude (Anthropic API) · SQLite (via Drizzle ORM + better-sqlite3)

Data lives in a local SQLite file at `data/ledger.db` — no external services required beyond the Anthropic API.

## Setup

```bash
npm install
cp .env.example .env.local
```

Add your Anthropic API key to `.env.local` (get one at [console.anthropic.com](https://console.anthropic.com/settings/keys)):

```
ANTHROPIC_API_KEY=sk-ant-...
```

Then run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/
  page.tsx            server component — loads initial ledger + chat history from SQLite
  api/chat/route.ts    streaming chat endpoint; the model calls tools to read/write the ledger
  api/ledger/route.ts   REST endpoint the sidebar uses to refresh, change currency, void an entry
components/
  LedgerApp.tsx        page layout: masthead, currency picker, two-pane grid
  ChatPanel.tsx         chat UI (useChat)
  LedgerSidebar.tsx     running totals, category breakdown, recent entries
lib/
  ledger.ts             shared types, categories, currency formatting, summary math
  db/                   Drizzle schema, SQLite client, query helpers
```
