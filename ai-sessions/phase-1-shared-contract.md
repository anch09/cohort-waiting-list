---
session: phase-1-shared-contract
date: 2026-06-23
status: draft
---

# Proposal — Phase 1 · Shared contract

## Goal

Define the wire contract once in `shared/src` — domain **entities** + request/response
**DTOs** — so `server` and `web` import it instead of redeclaring shapes. This is the seam
both later tracks build against.

## Decisions baked in

- **Responses include timestamps** (`createdAt`/`updatedAt` on list and cohorts).
- **`total` is derived** and lives only on the wire state, never persisted.
- **`nextSeq` is internal** — present on the entity, omitted from the wire DTO.

## Files

```
shared/src/entities.ts   WaitingList, Cohort (the persisted shape)
shared/src/dto.ts        WaitingListState, WaitingListSummary, request/response DTOs
shared/src/index.ts      re-export both
```

## Draft (NOT final)

```ts
// entities.ts — persisted shape
type Cohort = {
  id: string;
  seq: number; // stable display label
  count: number; // 1..capacity
  createdAt: string;
  updatedAt: string;
};
type WaitingList = {
  id: string;
  name: string;
  capacity: number;
  cohorts: Cohort[]; // NEWEST-FIRST (index 0 = newest)
  nextSeq: number; // internal counter
  version: number;
  createdAt: string;
  updatedAt: string;
};

// dto.ts — wire contract
type WaitingListState = Omit<WaitingList, 'nextSeq'> & { total: number };
type WaitingListSummary = {
  id: string;
  name: string;
  capacity: number;
  total: number;
  version: number;
};

type CreateListRequest = { name?: string; capacity?: number };
type CountRequest = { count: number };
type TakeResponse = { taken: number; state: WaitingListState };
type TotalResponse = { total: number };
```

## Tests / verification

`shared` is types-only, so there are no runtime tests. Verification is a clean typecheck:
`npx tsc -p shared/tsconfig.json` exits 0, and the types match `domain-design.md` §2/§6.

## Confidence: 0.95

The shapes mirror the docs and your earlier decisions. Approve and I'll implement Phase 1,
then write `phase-2-domain-core`.
