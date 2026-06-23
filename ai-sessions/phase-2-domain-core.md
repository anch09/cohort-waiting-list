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
  (`count < 1` incl. `0`, non-integer `count`, `capacity < 1`, blank `name`), even though
  Zod also guards it at the HTTP edge.
- **`take` clamps** to available (serve _up to_ N, return `taken`); over-take is valid.
- **Domain bumps `version` only on real change** — a no-effect op (e.g. `take` on an empty
  list) returns truthfully with `version` unchanged, which lets the store skip the write.
- `toState` drops `nextSeq` and adds `total`.

## Files

```
server/src/domain/waitingList.types.ts   DomainDeps
server/src/domain/waitingList.ts          create / add / take / total / toState / toSummary / DomainError
server/src/domain/waitingList.test.ts     the suite below
```

## Signatures (NOT final)

```ts
create(deps, { name?, capacity? }): WaitingList            // capacity default 10 (>= 1); name default "Untitled list"
add(deps, list, n): WaitingList                            // n >= 1; top up newest, then open new cohorts on the left
take(deps, list, n): { list: WaitingList; taken: number }  // n >= 1; FIFO from oldest; clamp to available; drop emptied
total(list): number
toState(list): WaitingListState                            // omit nextSeq, add total
toSummary(list): WaitingListSummary
```

Algorithm is exactly `domain-design.md` §3 (newest-first deque; only the two ends partial).

## Tests first (Vitest) — the cases I'll write before code

- **Brief flow:** create(10) → add 3 → add 13 → add 22 → take 4 → take 7 (total 27) → take 20 (total 7).
- **create:** defaults; rejects capacity `0`/`2.5`; rejects blank name.
- **add:** **rejects `add 0`** (and `-1`/`1.5`); top-up partial before opening; `capacity 1` → `[1,1,1]`.
- **take:** **rejects `take 0`** (and `-1`/`1.5`); **take exactly total** empties the list (`taken === total`); over-total clamps, drains to `[]` (`taken === total`); empty-list take (n>=1) → `taken 0` with `version` unchanged; emptied cohort removed (never persist `0`).
- **seq:** keeps climbing after a cohort is fully taken and removed (no reuse).
- **toState:** drops `nextSeq`, adds `total`.

## Verification

`npm test -w @elective/server` green; `npx tsc -p server/tsconfig.json` clean; lint clean.

## Confidence: 0.95

Pure, fully covered, deterministic. Approve and I'll implement Phase 2 (tests first), then
write `phase-3-file-store`.
