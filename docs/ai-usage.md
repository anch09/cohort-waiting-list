# AI Usage

How AI was used on this project, as required by the brief. This is a living
document, filled in as the work proceeds — it reflects the actual build, not a
polished retrospective.

## Where AI helped — and where it was overridden

- _Helped:_ …
- _Overridden:_ …

## One wrong or sloppy suggestion, and what was done instead

- **AI-written docs overclaimed concurrency.** An earlier draft said `version`
  enabled "stale-write detection on the server," but no mutation accepted an
  expected version — an unsupported claim. It was corrected to client-side
  optimistic reconciliation, since the store's per-id mutex already serializes
  writes (see `architecture.md` §7). _(More examples to be added during build.)_

## Written by hand, and why

- _…_

## How AI was driven

- _…_
