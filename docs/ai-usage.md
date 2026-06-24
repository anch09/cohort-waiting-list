# AI Usage

> **Draft skeleton** — populated with the actual events of this build. Edit freely, cut what
> you don't want, and put it in your own voice before submitting. The brief asks for three
> things: where AI helped vs. where you overrode it, one wrong/sloppy moment, and what you
> wrote (or decided) by hand.

## Where AI helped

- **Scaffolding & boilerplate** — monorepo (npm workspaces), TS/ESLint/Prettier/Vitest config,
  RTK Query wiring, the Tailwind UI shell. Fast, low-judgment work.
- **Tests** — drafted the TDD suites (domain, store, Supertest API, RTL web) from the brief's
  example flow and edge-case list.
- **Docs** — first drafts of `architecture.md` / `domain-design.md` / `tech-stack.md` and the
  per-task proposals in `ai-sessions/`.
- **Verification** — a live HTTP smoke test replaying the brief flow against the real server.

## Where I overrode it (or had to)

- **Workflow.** The AI's first attempt jumped straight to implementation — it built the whole
  backend and even spawned a second agent for the frontend — without the proposal-first
  workflow, making unilateral calls (framework version, validation placement, DTO shape). I
  **rolled the entire thing back** and required propose-per-task with sign-off, plus reaching
  certainty on assumptions before any code. _(Add: how this changed the rest of the build.)_
- **`add 0` / `take 0`.** AI first made them `200` no-ops. I pushed back (an action we don't
  want shouldn't run server logic) → changed to reject `400`, and added "persist only on
  change" so genuine no-ops like `take` on an empty list still cost no disk write.
- **Capacity field.** AI made capacity required in the create form; I wanted blank → "Defaults
  to 10" (it's optional in the API).
- **Scope calls I made:** dropped rename/delete, kept names non-unique, chose **dev-only**
  running over Express serving the SPA, dropped MSW in favor of `vi.mock`, and chose Tailwind.

## One wrong or sloppy suggestion, and what was done instead

- **Docs overclaimed concurrency.** An early draft said `version` enabled "stale-write
  detection on the server," but no mutation accepted an expected version. Corrected to
  client-side optimistic reconciliation, since the per-id mutex already serializes writes
  (`architecture.md` §7).
- _(Optional second example: AI pinned `@eslint/js` to `10.5.0` assuming it tracks ESLint's
  version — that version doesn't exist and `npm install` failed; corrected to `10.0.1`.)_

## Written / decided by hand, and why

- **The domain rules** came from reading the brief's edge-case list myself: "capacity of 1" →
  minimum is 1 (not 2); "take _up to_ N" → clamp, not error; reject zero-count.
- **The UX** — over-take inline confirm, Take disabled on an empty list with a reason, the
  "Up to N available" hint, error banners — came out of my own review passes, not the model.
- _(Add anything you actually hand-wrote line-by-line and why.)_

## How AI was driven

- Proposal per task in `ai-sessions/`, reviewed/refined before implementing; TDD red → green;
  I reviewed each phase, caught the model's mistakes, and made the product/scope/UX decisions.
