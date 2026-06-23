# CLAUDE.md

Short guidance for Claude Code in this repo. The full design lives in `docs/`
(`architecture.md` · `domain-design.md` · `tech-stack.md`) — this is the digest.

## Style

**Clear and concise.** Lead with the answer (BLUF), then the reasoning. Plain language,
no filler, short sentences. Prefer a minimal example or mermaid diagram to prose, and
state trade-offs explicitly. Go deeper only when asked.

## What this is

A small web tool to manage **waiting lists** of fixed-size **cohorts**: add creators,
take cohorts off the front (FIFO), see totals. React SPA → Express REST API → pure
domain core → JSON files on disk (no database).

## Commands

```bash
npm install        # install all workspaces
npm run dev        # Vite + Express together
npm test           # Vitest (domain, store, API)
npm run lint       # ESLint + Prettier
npm run build      # build the SPA
```

_Target scripts — available once the project is scaffolded (see
`docs/implementation/tasks.md`)._

## Stack

TypeScript throughout. **Server:** Express + Zod + nanoid. **Web:** React + Vite +
Redux Toolkit / RTK Query. **Tests:** Vitest + Supertest + React Testing Library.
Monorepo via npm workspaces: `server`, `web`, `shared`.

## Layout

- `server/src` — `domain/` (pure rules), `store/` (file persistence), `controllers/`,
  `routes/`, `schemas/` (Zod), `middleware/`.
- `web/src` — `api/` (RTK Query), `components/` (presentational), `views/` (screens),
  `app/` (Redux store).
- `shared/` — the wire contract (entities + DTOs). Single source of truth.
- `data/` — JSON persistence, one file per list `<id>.json` (git-ignored).

## Domain rules (don't break these)

- **Cohorts are an ordered deque, newest-first** (`cohorts[0]` = newest/left).
  **Add** tops up the newest cohort, then opens new ones on the left. **Take** serves
  FIFO from the oldest (array end).
- **Invariant:** every middle cohort is full at `capacity`; only the two ends can be
  partial. A cohort hitting `count === 0` is removed — never persist `0`.
- `capacity` is per-list and fixed. `total` is derived (`Σ count`), never stored.
- `add 0` / `take 0` are valid no-ops → `200`. Negative / non-integer `count` or
  `capacity` → `400`. Unknown list → `404`.
- Full model, algorithms, and edge cases: `docs/domain-design.md`.

## Test-driven development (required)

Everything here is **TDD**: write the failing test first, then the code to pass it.

- Red → green → refactor, in small steps. No code without a test that needs it.
- Domain and store → Vitest units; API → Supertest; components → React Testing Library.
- Seed tests from the brief's example flow and `docs/domain-design.md` §4 edge cases
  before implementing. Keep tests beside the code (`*.test.ts`).

## Conventions

- **Pure core, thin shell.** Domain logic is IO-free; HTTP and `fs` are thin adapters.
  Never import `fs` or Express into `domain/`.
- **One module, one folder, co-located `*.types.ts`.** Don't pool types into catch-all
  files. Cross-package shapes live in `shared/`, never redeclared.
- **All server calls go through RTK Query** (`web/src/api/`). Mutations invalidate
  tags; no manual `refetch()`.
- **Validate at the boundary with Zod**; the domain assumes clean input.
- **Persistence is atomic:** write `*.tmp` → rename; every mutation runs through the
  per-id mutex via the store's `withList(id, fn)` helper and bumps `version`.
- Make minimal, focused changes. Formatting is automatic — a `PostToolUse` hook runs
  Prettier on each file you edit (`.claude/settings.json`).

## Workflow

Plan before building: `/propose <task>` → `/refine <feedback>` → implement on approval.
Proposals are written to `ai-sessions/`.

Track implementation in `docs/implementation/`: `tasks.md` (the step-by-step build
plan) and `progress.md` (status log). Update `progress.md` as phases complete.
