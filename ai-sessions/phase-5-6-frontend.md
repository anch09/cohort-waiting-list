---
session: phase-5-6-frontend
date: 2026-06-23
status: approved
---

# Proposal — Phase 5–6 · Frontend (data layer + UI)

## Goal

Build the web app: an RTK Query data layer against the shared contract, plus the UI to
create/select lists and add/take/see totals. Proposed together; can land in two commits
(api slice, then UI). Phase 7 (dev wire-up + README) follows separately.

## Decisions baked in (flagged for `/refine`)

- **Tailwind for styling** — set up Tailwind v4 via the `@tailwindcss/vite` plugin (one
  `@import "tailwindcss"` in `styles.css`, no PostCSS/config sprawl). **DaisyUI** (a Tailwind
  plugin of prebuilt components) is an easy later add — noted, not now.
- **No MSW; test from rendered outputs** — the high-value frontend tests are UI behavior we
  assert directly from the DOM (see below). No network mock library is added.
- **Invalidation-only, no optimistic updates** — matches CLAUDE.md ("mutations invalidate
  tags; no manual `refetch()`").
- **No router** — single screen; the active list id lives in local React state.
- **Scope:** multiple lists, **create + select** (no rename/delete).

## Testing approach (replaces MSW)

Three layers, all asserting observable output — no network library:

1. **`NumberField` (pure RTL)** — the validation you called out:
   - typing `1.5` → blocked / "Whole numbers only"; submit stays disabled.
   - typing `0` (or empty/`-1`) → inline error **"Minimum is 1"**; submit disabled.
   - typing `5` → valid; submit enabled; emits the integer `5`.
2. **`CohortBar` (pure RTL)** — renders counts as ordered boxes, flags newest/oldest
   (served-next), empty list → placeholder.
3. **`WaitingListsView` (RTL + mocked hooks)** — `vi.mock` the generated api hooks to feed
   canned query data and spy mutations; assert the screen renders lists/cohorts/total and that
   Add/Take/Create call the right mutation with the right args. Deterministic, zero network.

The true live round-trip (browser → Express → disk) is verified by **Phase 7 manual smoke**
plus the backend's own Supertest suite — not duplicated here.

> Risk: no _automated_ browser↔server integration test. Accepted for a take-home; the contract
> is typed (`@elective/shared`) and both ends are tested against it independently.

## Endpoints & cache tags (architecture §5)

| Endpoint                  | Kind     | Tags                                               |
| ------------------------- | -------- | -------------------------------------------------- |
| `getLists`                | query    | provides `{ WaitingList, 'LIST' }`                 |
| `getList(id)`             | query    | provides `{ WaitingList, id }`                     |
| `getTotal(id)`            | query    | provides `{ WaitingList, id }`                     |
| `createList`              | mutation | invalidates `{ WaitingList, 'LIST' }`              |
| `addCreators(id, count)`  | mutation | invalidates `{ WaitingList, id }` + `{ …,'LIST' }` |
| `takeCreators(id, count)` | mutation | invalidates `{ WaitingList, id }` + `{ …,'LIST' }` |

add/take also invalidate `LIST` because the sidebar summaries show totals.

## Files (architecture §9)

```
web/src/
  main.tsx                       <Provider store> + render
  App.tsx                        layout → WaitingListsView
  app/store.ts                   configureStore: baseApi reducer + middleware
  app/hooks.ts                   typed useAppDispatch / useAppSelector
  api/baseApi.ts                 createApi: fetchBaseQuery('/api'), tagTypes ['WaitingList']
  api/waitingLists/waitingLists.api.ts     injectEndpoints (the 6 above)
  api/waitingLists/waitingLists.types.ts   hook arg/result helper types
  components/CohortBar/          CohortBar.tsx + .types.ts + .test.tsx
  components/NumberField/        NumberField.tsx + .types.ts + .test.tsx
  views/WaitingListsView/        WaitingListsView.tsx + .types.ts + .test.tsx
  styles.css                     @import "tailwindcss";
  setupTests.ts                  import '@testing-library/jest-dom'
```

Also: add `@tailwindcss/vite` to `vite.config.ts`; add Tailwind deps to `web/package.json`
(pinned exact). Co-located `*.types.ts`; all wire shapes from `@elective/shared`.

## UI

- **Sidebar:** lists (name + total) + a "New list" form (name, capacity); click selects.
- **Active list:** `CohortBar` (e.g. `[8,10,10,10]` boxes, oldest = served-next), the total,
  and Add / Take controls (`NumberField`). Empty states: no lists yet; selected list empty.

## New dependencies

- `tailwindcss`, `@tailwindcss/vite` (pinned exact, latest 4.x). **No MSW.**

## Verification

`npm test -w @elective/web` green; `tsc -p web` clean; `npm run lint` clean. Frontend builds and
tests independently of Phases 3–4.

## Confidence: 0.92

Open only if you want the optional **DaisyUI** layer now, or an automated live-integration test.
Approve and I'll implement tests-first, then write `phase-7-wireup`.
