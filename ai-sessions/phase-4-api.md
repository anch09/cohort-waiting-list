---
session: phase-4-api
date: 2026-06-23
status: draft
---

# Proposal — Phase 4 · API (TDD)

## Goal

Expose the domain over REST: Zod validation at the boundary, thin controllers that run a
domain op through the store, routes under `/api`, and central error mapping. Tests first
(Supertest).

## Decisions baked in

- **`createApp(store)`** builds the Express app without `listen` — so tests drive it with a
  temp-dir store; `index.ts` does the actual `listen`.
- **Express 5 async errors** — handlers that reject are auto-forwarded to the error
  middleware, so no `asyncHandler` wrapper is needed.
- **Error mapping:** `ZodError`/`DomainError` → **400**, `NotFoundError` → **404**, else **500**.
- **Runtime deps** (`now`, `id` via `Date`/`nanoid`) live in the controller — the domain
  stays pure.
- **No CORS** — dev uses Vite's `/api` proxy; prod serves SPA + API from one origin.

## Files

```
server/src/config/config.ts                 dataDir, port, defaultCapacity
server/src/schemas/waitingLists.schema.ts    Zod: createListSchema, countSchema (count >= 1)
server/src/middleware/errorHandler.ts        ZodError/DomainError → 400, NotFoundError → 404
server/src/middleware/notFound.ts            unmatched route → 404
server/src/controllers/waitingLists.controller.ts
server/src/routes/waitingLists.routes.ts     resource router
server/src/routes/index.ts                   mount under /api + health
server/src/app.ts                            createApp(store)
server/src/index.ts                          bootstrap (replaces placeholder)
server/src/routes/waitingLists.api.test.ts   Supertest suite
```

## Endpoints (from domain-design §6)

`GET /api/waiting-lists` · `POST /api/waiting-lists` (201) · `GET /:id` · `POST /:id/add` ·
`POST /:id/take` → `{ taken, state }` · `GET /:id/total`

## Tests first (Supertest, temp-dir store per test)

- create → **201**, default capacity 10, `total 0`, no `nextSeq` leaked.
- **brief flow over HTTP** (add/take/total match the example).
- list → summaries only (no `cohorts`).
- **`add 0` / `take 0` → 400** (rejected, per the updated rules).
- invalid `count` (`-1`, `1.5`) and `capacity` (`0`) → **400**.
- unknown id → **404** (GET and add).
- `take` → `{ taken, state }`; over-total clamps (`taken === total`).

## Verification

`npm test -w @elective/server` green; `npx tsc -p server/tsconfig.json` clean; lint clean.

## Confidence: 0.92

One thing to confirm: I'm relying on **Express 5's built-in async-error forwarding** (no
`asyncHandler`). If you'd rather have an explicit wrapper for clarity, say so. Otherwise
approve and I'll implement Phase 4, then write `phase-5-web-data`.
