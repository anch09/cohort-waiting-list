---
session: phase-2-domain-core
date: 2026-06-23
status: draft
---

# Proposal — Phase 2 · Domain core (TDD)

## Goal

Implement the pure waiting-list rules — `create` / `add` / `take` / `total` — plus the
`toState` / `toSummary` mappers. No IO, no clock, no randomness. Tests first.

## Decisions baked in

- **Purity via injected deps** — functions take `deps = { now(): string, id(): string }`, so
  the core imports no `Date`/`nanoid` and tests are deterministic.
- **Validate at the boundary AND in the domain** — a `DomainError` is thrown on bad input
  (negative/non-integer `count`, `capacity < 1`, blank `name`), even though Zod also guards
  it at the HTTP edge.
- **Domain bumps `version`** on each mutation; `toState` drops `nextSeq` and adds `total`.

## Files

```
server/src/domain/waitingList.types.ts   DomainDeps
server/src/domain/waitingList.ts          create / add / take / total / toState / toSummary / DomainError
server/src/domain/waitingList.test.ts     the suite below
```

## Signatures (NOT final)

```ts
create(deps, { name?, capacity? }): WaitingList            // capacity default 10; name default "Untitled list"
add(deps, list, n): WaitingList                            // top up newest, then open new cohorts on the left
take(deps, list, n): { list: WaitingList; taken: number }  // FIFO from oldest; drop emptied cohorts
total(list): number
toState(list): WaitingListState                            // omit nextSeq, add total
toSummary(list): WaitingListSummary
```

Algorithm is exactly `domain-design.md` §3 (newest-first deque; only the two ends partial).

## Tests first (Vitest) — the cases I'll write before code

- **Brief flow:** create(10) → add 3 → add 13 → add 22 → take 4 → take 7 (total 27) → take 20 (total 7).
- **create:** defaults; rejects capacity `0`/`2.5`; rejects blank name.
- **add:** `add 0` no-op (no version bump); top-up partial before opening; `capacity 1` → `[1,1,1]`; rejects `-1`/`1.5`.
- **take:** `take 0` no-op; over-total drains to `[]`; empty list → `taken 0`; emptied cohort removed (never persist `0`).
- **seq:** keeps climbing after a cohort is fully taken and removed (no reuse).
- **toState:** drops `nextSeq`, adds `total`.

## Verification

`npm test -w @elective/server` green; `npx tsc -p server/tsconfig.json` clean; lint clean.

## Confidence: 0.95

Pure, fully covered, deterministic. Approve and I'll implement Phase 2 (tests first), then
write `phase-3-file-store`.
