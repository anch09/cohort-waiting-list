# Progress

Live status of [`tasks.md`](./tasks.md). Update as phases move.
Legend: ☐ todo · ◐ in progress · ☑ done.

| Phase                 | Status | Notes                                                                                                   |
| --------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| 0 · Scaffold          | ☑      | workspaces + TS + ESLint/Prettier + Vitest; pinned exact versions (Express 5). install/test/lint clean. |
| 1 · Shared contract   | ☑      | entities + DTOs in `shared/`; typecheck clean.                                                          |
| 2 · Domain core (TDD) | ☑      | create/add/take/total + toState; reject 0-count, clamp over-take; 15 tests green.                       |
| 3 · File store (TDD)  | ☑      | atomic write, per-id mutex, persist-on-change, `withList`; 8 store tests green.                         |
| 4 · API (TDD)         | ☐      |                                                                                                         |
| 5 · Web data layer    | ☐      |                                                                                                         |
| 6 · Web UI            | ☐      |                                                                                                         |
| 7 · Wire-up & polish  | ☐      |                                                                                                         |

## Log

- 2026-06-23 — Reset to proposal-first workflow; per-task proposals now live in `ai-sessions/`.
- 2026-06-23 — Phase 0 approved (`phase-0-scaffold.md`) and implemented: monorepo scaffold,
  exact pinned versions (Express 5.2.1). `npm install`/`test`/`lint` all clean.
- 2026-06-23 — Phase 1 approved (`phase-1-shared-contract.md`) and implemented: entities + DTOs
  in `shared/`; typecheck + lint clean.
- 2026-06-23 — Rules tightened: `add 0`/`take 0` rejected (400), `take` clamps to available,
  store persists only on change. Updated CLAUDE.md + domain-design + architecture.
- 2026-06-23 — Phase 2 approved (`phase-2-domain-core.md`) and implemented TDD: domain core
  (create/add/take/total/toState/toSummary); 15 tests green; typecheck + lint clean.
- 2026-06-23 — Phase 3 approved (`phase-3-file-store.md`) and implemented TDD: file store
  (atomic write, per-id mutex, persist-on-change, `withList`); 24 server tests green.
