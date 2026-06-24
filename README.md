# Elective — Waiting List

A small web tool to manage **waiting lists** of fixed-size **cohorts**: add creators, take
cohorts off the front (FIFO), and see totals. A React SPA talks over REST/JSON to an Express
API that runs a pure domain core and persists state to JSON files on disk — no database.

## Quick start

```bash
npm install
npm run dev
```

- Web (Vite): http://localhost:5173 — open this.
- API (Express): http://localhost:3000 — Vite proxies `/api` to it.

## Scripts

```bash
npm run dev     # Vite + Express together (concurrently)
npm test        # all tests — domain, store, API (Vitest + Supertest), web (Vitest + RTL)
npm run lint    # ESLint + Prettier
npm run build   # build the web SPA
```

## How it works

Cohorts form an ordered deque stored **newest-first**. **Add** tops up the newest cohort,
then opens new cohorts on the left; **Take** serves FIFO from the oldest end. Only the two
ends can ever be partial. `total` is derived (`Σ count`), never stored.

- `add 0` / `take 0` are rejected (400); `take` clamps to what's available and reports how
  many were served.
- Persistence is one JSON file per list under `data/`, written atomically (tmp → rename)
  behind a per-id mutex; a no-op mutation skips the write.

Full design: [`docs/architecture.md`](docs/architecture.md) ·
[`docs/domain-design.md`](docs/domain-design.md) · [`docs/tech-stack.md`](docs/tech-stack.md).

## Structure

```
shared/   wire contract — entities + DTOs (single source of truth)
server/   Express API — domain/ (pure rules) · store/ (file persistence) · controllers · routes
web/      React SPA — api/ (RTK Query) · components/ · views/ · app/ (Redux)
data/     JSON persistence, one file per list (git-ignored)
docs/     architecture · domain-design · tech-stack · implementation plan + AI-usage writeup
```

## Testing

TDD throughout — tests were written before the code they cover. `npm test` runs the full
suite (server + web).

## AI usage

How AI was used on this project — where it helped, where it was overridden, and what was
written by hand — is in [`docs/ai-usage.md`](docs/ai-usage.md).
