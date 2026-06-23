# Domain Design — Elective Waiting List

> The detailed rules behind the system: data model, algorithms, edge cases, and
> the data-structure decision. The global system view is in
> [`architecture.md`](./architecture.md).

## 1. The core insight

The two write operations are **asymmetric**:

- **Add** acts on the **left / newest** end.
- **Take** acts on the **right / oldest** end (FIFO).

This yields the central invariant:

> **Every cohort in the middle is always full. Only the two ends can be partial.**

(`Take` drains the right; `Add` tops up the left and prepends. Nothing ever
touches the middle, so the middle stays at `capacity`.)

## 2. Data model

```ts
type WaitingList = {
  id: string; // server-assigned nanoid
  name: string; // human display label; set at creation, non-unique
  capacity: number; // per-cohort max; integer >= 1; default 10
  cohorts: Cohort[]; // stored NEWEST-FIRST: index 0 = left/newest
  nextSeq: number; // next cohort label to hand out; only ever increases
  version: number; // monotonic; bumped on every mutation
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
};

type Cohort = {
  id: string; // stable unique id
  seq: number; // monotonic creation order; lower = older = served sooner
  count: number; // live creator tally; invariant: 1 <= count <= capacity
  createdAt: string; // ISO timestamp (when the cohort was opened)
  updatedAt: string; // ISO timestamp (last add/take that touched it)
};
```

- **`capacity` lives on the list, not the cohort** — the brief sets it at list
  creation and calls it _fixed_, so it's one shared value across the list's cohorts.
- **`name`** is a human label set at creation (defaulted if omitted); it is not an
  identifier. The `id` is a server-assigned nanoid.
- **`count`** is the number shown in the brief's brackets (`[6, 10]`).
- **`seq`** is a stable display label, assigned from `nextSeq` when a cohort opens.
  Serving order comes from the array (newest-first) and identity from `id`; `seq`
  only gives the UI a cohort number that never shifts or repeats as cohorts drain.
- **`nextSeq`** is a list-level counter that only increases — the source of `seq`.
  Drawing from it (not `max(seq) + 1`) keeps numbers climbing instead of being
  reused after old cohorts are removed.
- **`total` is derived, never stored** (`Σ count`) — avoids drift.
- **`version`** is a monotonic stamp for client-side optimistic reconciliation;
  writes are serialized by the store's per-id mutex (no expected-version check).
- **Cohorts are stored newest-first** so the JSON mirrors the visualization
  (`cohorts.map(c => c.count)` === `[6, 10]`); `Take` serves from the array's end.

## 3. Algorithms (pure, IO-free)

### create(name?, capacity = 10)

Validate `capacity` is an integer `>= 1` and `name` (if given) is a non-empty
string. Return a new list with a server-assigned `id`, the given/defaulted `name`,
`cohorts: []`, `nextSeq: 1`, and `version: 1`.

### add(list, n)

1. Validate `n` is a non-negative integer. If `n === 0`, no-op.
2. **Top up the newest cohort** (`cohorts[0]`) if it exists and is partial:
   `fill = min(capacity - cohorts[0].count, n)`; add it; `n -= fill`.
3. **Open new cohorts on the left** while `n > 0`:
   `chunk = min(capacity, n)`; unshift a cohort with `count = chunk` and
   `seq = list.nextSeq++` (assign, then increment the counter); `n -= chunk`.

Worked example — `Add 22` to `[6, 10]` (capacity 10): top up `6 → 10` (used 4,
`n = 18`) → open `10` (`n = 8`) → open `8` (`n = 0`) → `[8, 10, 10, 10]`. ✔

### take(list, n)

1. Validate `n` is a non-negative integer. If `n === 0`, return `{ taken: 0 }`.
2. While `n > 0` and cohorts remain: `last = cohorts[last]` (oldest);
   `d = min(last.count, n)`; `last.count -= d`; `n -= d`; `taken += d`;
   if `last.count === 0`, remove it.
3. Return `{ taken }`, where `taken = min(requested, totalAvailable)`.

Worked example — `Take 7` on `[8, 10, 10, 6]`: drain `6 → 0` (remove, taken 6),
drain `10 → 9` (taken 7) → `[8, 10, 9]`. ✔

### total(list)

`cohorts.reduce((s, c) => s + c.count, 0)`.

## 4. Edge cases (explicitly handled)

| Case                                     | Behavior                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| `add 0`                                  | No-op; returns current state, `200`.                                           |
| `take 0`                                 | No-op; `{ taken: 0 }`, `200`.                                                  |
| `take` more than total                   | Drains everything; `taken = total`; list becomes `[]`.                         |
| `take` / `add` on empty list             | `take` → `{ taken: 0 }`; `add` opens cohorts normally.                         |
| `capacity = 1`                           | Fully supported: `add 3` → `[1, 1, 1]`; `take 1` → `[1, 1]`.                   |
| Empty cohort after removal               | A cohort hitting `count === 0` is removed immediately; `0` is never persisted. |
| Negative / non-integer `n` or `capacity` | Rejected with `400` at the API boundary.                                       |
| Partial-then-full add                    | Top-up fills the left partial before opening new cohorts.                      |

> `add 0` / `take 0` are treated as valid no-ops (`200`), not errors: the brief
> specifies "add _any_ number" and "take _up to_ N", so zero is within range.

## 5. Decision record — ordered array (deque) vs alternatives

| Option                          | Verdict    | Reasoning                                                                                                                                                                                              |
| ------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Ordered array / deque**       | **Chosen** | JSON-native (the persistence requirement), holds per-cohort metadata like a node would, trivial to render. `Add`/`Take` map to front/end ops.                                                          |
| Doubly-linked list              | Rejected   | O(1) at both ends, but requires hand-rolled node↔JSON (de)serialization for a performance gain that is immaterial here (cohort count = creators/10, and the whole file is rewritten on each mutation). |
| Compact counters (`total` only) | Rejected   | Can't represent two independent end-partials (e.g. `[8, 10, 9]`) — the shape isn't derivable from a total. Can't carry metadata.                                                                       |

The array provides the same benefits sought from a linked list (metadata, ordered
cohorts) without the serialization cost.

## 6. API contract

Lists are a collection. Every list-state response carries `version`.

| Method | Path                           | Body                   | Returns                                                |
| ------ | ------------------------------ | ---------------------- | ------------------------------------------------------ |
| GET    | `/api/waiting-lists`           | —                      | `[{ id, name, capacity, total, version }]` (summaries) |
| POST   | `/api/waiting-lists`           | `{ name?, capacity? }` | created list state                                     |
| GET    | `/api/waiting-lists/:id`       | —                      | `{ id, name, capacity, cohorts, total, version }`      |
| POST   | `/api/waiting-lists/:id/add`   | `{ count }`            | updated list state                                     |
| POST   | `/api/waiting-lists/:id/take`  | `{ count }`            | `{ taken, state }`                                     |
| GET    | `/api/waiting-lists/:id/total` | —                      | `{ total }`                                            |

Errors: invalid `count`/`capacity`/`name` → `400`; unknown list → `404`.

## 7. Testing strategy

- **Domain unit tests (primary):** replay the brief's full example flow as one
  test; one test per edge case in §4.
- **Store tests:** save/load round-trip; atomic write; mutex serializes concurrent
  mutations.
- **API tests (light):** happy path per endpoint + validation `400`s.
