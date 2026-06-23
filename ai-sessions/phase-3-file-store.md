---
session: phase-3-file-store
date: 2026-06-23
status: draft
---

# Proposal — Phase 3 · File store (TDD)

## Goal

Persist lists as one JSON file per list under `data/`, with atomic writes, a per-id mutex
so read-modify-write cycles can't interleave, and the `withList(id, fn)` helper the
controllers will use. **Persist only on change.** Tests first.

## Decisions baked in

- **Factory `createFileStore(dataDir)`** — `dataDir` injected so tests use a temp dir
  (`fs.mkdtemp`) and never touch the repo's `data/`.
- **Atomic writes** — write `*.tmp` (nanoid suffix) → `rename` over the target.
- **Per-id mutex** — async tasks chained per list id; one read-modify-write at a time.
- **Persist on change only** — `withList` skips the write when the domain leaves
  `version` unchanged (e.g. `take` on an empty list): one read, no write.
- **`NotFoundError`** on unknown id (mapped to 404 at the boundary later).

## Files

```
server/src/store/fileStore.types.ts   ListStore port
server/src/store/fileStore.ts          createFileStore + NotFoundError (mutex, atomic write, persist-on-change)
server/src/store/fileStore.test.ts     the suite below
```

## Port (NOT final)

```ts
type ListStore = {
  enumerate(): Promise<WaitingList[]>;
  load(id: string): Promise<WaitingList | null>;
  save(list: WaitingList): Promise<WaitingList>;
  // load → fn → save only if version changed; under a per-id mutex
  withList<T extends { list: WaitingList }>(
    id: string,
    fn: (current: WaitingList) => T
  ): Promise<T>;
};
```

## Tests first (Vitest, temp dir per test)

- **round-trip:** `save` then `load` returns an equal list.
- **unknown id:** `load` → `null`.
- **enumerate:** returns all saved lists.
- **atomic:** after a save, no `*.tmp` files remain.
- **withList:** applies the domain op and persists it (reload reflects the change).
- **withList unknown id:** rejects with `NotFoundError`.
- **mutex:** 50 concurrent `withList(add 1)` end at total 50 (no lost updates).
- **persist-on-change:** a no-op `withList` (`take` on empty list) returns `taken 0` and
  **does not rewrite the file** (mtime unchanged).

## Verification

`npm test -w @elective/server` green; `npx tsc -p server/tsconfig.json` clean; lint clean.

## Confidence: 0.95

Approve and I'll implement Phase 3 (tests first), then write `phase-4-api`.
