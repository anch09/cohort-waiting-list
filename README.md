# Elective — Waiting List

Manage **waiting lists** of fixed-size **cohorts**: add creators, take cohorts off the front
(FIFO), see totals. React SPA → Express REST API → **pure domain core** → JSON files on disk
(no database). This README doubles as the writeup; the deep design lives in
[`docs/`](docs/) ([architecture](docs/architecture.md) ·
[domain-design](docs/domain-design.md) · [tech-stack](docs/tech-stack.md)).

## Quick start

```bash
npm install
npm run dev      # Vite (web, :5173) + Express (API, :3000); Vite proxies /api
```

Open http://localhost:5173.

| Script          | Does                                                             |
| --------------- | ---------------------------------------------------------------- |
| `npm run dev`   | web + API together (`concurrently`)                              |
| `npm test`      | full suite — domain & store (Vitest), API (Supertest), web (RTL) |
| `npm run lint`  | ESLint + Prettier                                                |
| `npm run build` | build the web SPA                                                |

## How it works

Within a list, cohorts are an ordered **deque stored newest-first** (`cohorts[0]` = newest).
**Add** tops up the newest cohort, then opens new cohorts on the left; **Take** serves FIFO
from the oldest (array end). Because nothing ever touches the middle, **only the two ends can
be partial** — that invariant is what keeps the model simple. `total` is derived (`Σ count`),
never stored. Full algorithm + worked examples: [`domain-design.md`](docs/domain-design.md).

## Edge cases & decisions

Most of these are an edge case, a judgment call, and a performance trade-off at the same time.
Each one, and why:

- **Adding or taking 0 is rejected, not silently ignored:** A request for zero creators does
  nothing useful, so the API turns it away the moment it arrives instead of opening the list and
  running the logic for nothing. The form also disables the button, so it normally never gets sent.

- **Taking more than the list holds serves everyone available — and says how many:** The brief
  says "take up to N", so asking for 11 when only 10 are waiting serves all 10, and the screen
  shows "Served 10" (not 11) so nothing is misreported. The app asks you to confirm first when you
  request more than there are.

- **Counts and capacity must be whole numbers — no decimals, no negatives** (so `1.5` or `-1` are
  turned away): checked in three places, outermost first — the form stops it before sending, the
  API re-checks every request with Zod, and the core rules check once more, so they're safe even
  if used directly.

- **A cohort that empties out disappears — it's never stored as a "0":** When the last person in
  the oldest cohort is taken, that cohort is removed rather than left as an empty box, so the
  saved list stays honest: `[8, 10]`, not `[8, 10, 0]`.

- **An action that changes nothing isn't written to disk:** Taking from an empty list, for
  example, is allowed but simply reports "0 served" — it reads the list but skips saving, since
  there's nothing to save.

- **A list doesn't need a name, and names can repeat:** The real identifier is a generated id;
  the name is just a label. Forcing names to be unique would add complexity and a subtle race
  condition for no real benefit — so leave it blank and it's simply "Untitled list".

- **Every cohort gets a stable number that never repeats:** A per-list counter (`nextSeq`) tracks
  how many cohorts the list has ever opened, and each new cohort takes the next number (`seq`).
  The core logic doesn't need it — it's there so the UI can show a cohort number, and for future
  reporting.

Full per-rule detail: [`domain-design.md` §4](docs/domain-design.md).

## TypeScript judgment

Types here prevent bugs — they're not decoration:

- **One source of truth for every data shape:** The server and the web app share a single set of
  definitions (in `shared/`), so what the API sends and what the UI expects can't drift apart —
  change a shape in one place, or it won't compile.

- **Internal fields can't leak to the client, and the compiler enforces it:** The response type is
  defined as "the stored list, minus the internal counter, plus the running total." So an internal
  field is never accidentally sent, and the total is always there — with no hand-written conversion
  to keep in sync.

- **The business rules never reach for the clock or for random ids — those are passed in:** keeping
  time and id-generation out of the core logic makes it pure and predictable, and lets the tests
  feed it a fixed time and a simple counter so every run gives the exact same result.

- **The compiler forces the "empty list" case to be handled:** a strict setting makes "the
  first/last cohort" a _maybe-missing_ value, so the code can't just assume a cohort is there — it
  has to handle the empty or single-cohort list on purpose.

- **One definition does both the checking and the typing:** the same rule that validates an
  incoming request (e.g. "a whole number, at least 1") also produces its TypeScript type, so the
  checked value is correctly typed with no duplication. Bad input becomes a clear 400; an unknown
  list, a 404.

## Structure & testing

- **Pure rules, thin everything-else:** the core logic (add / take / total) is pure — it has no
  idea it's behind a web server or that data lives in files. The web layer and the storage layer
  are thin wrappers around it: a request comes in, the rules do the work, and one small helper
  loads the list, applies the change, and saves it. So the rules are easy to test on their own,
  and the storage could be swapped (say, for a database) without touching them. Layout +
  rationale: [`architecture.md` §9](docs/architecture.md).

- **Tests written first, all the way through:** `npm test` runs **53** of them (31 on the server,
  22 on the web). The tricky persistence guarantees are tested directly — that a save never leaves
  a half-written file behind, and that 50 saves happening at once don't lose any updates.

## Performance & future

- **Each change rewrites the whole list file — and that's fine here:** a list only ever holds a
  handful of cohorts (roughly people ÷ capacity), it's a single-operator tool, and writing to disk
  is the slow part anyway. So the choice of data structure (a plain array) doesn't matter for
  speed — and the real lever for scale would be the storage itself (a database), not a cleverer
  structure.
- **No wasted writes, no clobbered writes:** a change that doesn't actually change anything is
  never saved, and edits to the same list are handled one at a time, so two requests can't
  overwrite each other.
- **Future work:** durable storage (a database), an audit log, live updates, serving the app on a
  single port, and editable capacity — sketched in [`architecture.md` §10](docs/architecture.md).

## AI usage

The brief grades _how_ the tools were driven. My approach:

- **Scoped it myself before bringing AI in:** I sketched the model on paper and nailed down the
  assignment first, choosing the simplest design that still met the brief. Only then did I have
  the AI draft the architecture, tech-stack, and domain-design docs — which I reviewed and refined
  with it until they matched what I wanted.
- **Made the AI follow those docs, not improvise:** with the design set, I had it generate a
  `CLAUDE.md` and `propose`/`refine` skills that force every proposal to be read from and built
  around the architecture docs. That kept it aligned with what we'd already decided — and let me
  impose a way of working (TDD: agree the test cases first, write the tests, then the logic).
- **Gave it a memory:** a generated task list and progress log track what's done and what's next,
  so it keeps its bearings even across closed terminal sessions.
- **Made it ask, not assume:** every proposal carries a confidence score and any open questions;
  the skill won't let it guess — it resolves the unknowns or asks me.
- **Reviewed and gated every step:** I went through each proposal and refined it until it was
  ready; only after my approval were the tests re-run, with a quick smoke test where something
  needed a closer look.
- **Trimmed it when it over-reached:** the AI leaned toward building more than the brief needed,
  and I cut it back. It wanted `add 0` / `take 0` accepted as no-ops — I rejected that, since
  spending a request and compute on an operation that does nothing is wasteful (they return a 400
  instead). It also tried to pull in MSW to test the data layer — out of scope and unnecessary to
  prove the app works, so I dropped it.
