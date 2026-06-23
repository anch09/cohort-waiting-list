---
session: phase-0-scaffold
date: 2026-06-23
status: draft
---

# Proposal — Phase 0 · Scaffold

## Goal

Stand up the monorepo skeleton so every later task has a working toolchain: npm
workspaces (`shared` / `server` / `web`), TypeScript, ESLint + Prettier, Vitest, and the
dev/build/test/lint scripts. **No app code in this phase.**

## Why this is first

Everything downstream imports `@elective/shared`, runs under Vitest, and builds via these
configs. Nothing is testable until the skeleton exists.

## What it creates

```
package.json            workspaces + scripts (dev / build / test / lint)
tsconfig.base.json      strict TS, extended by every package
eslint.config.js        flat config (eslint 9 + typescript-eslint)
.prettierrc.json
.gitignore              node_modules, dist, data/
shared/   package.json + tsconfig.json            (types-only package)
server/   package.json + tsconfig.json + vitest.config.ts   (node env)
web/      package.json + tsconfig.json + vite.config.ts + vitest.config.ts + index.html   (jsdom env)
```

## Decisions baked in

- **Exact pinned versions** in every `package.json` — no `^`/`~` ranges; the values below
  are the current latest stable.
- **Express 5** (5.2.1, latest stable) instead of 4.
- **Run via tsx** — server dev and prod; server `build` only typechecks. Web builds via Vite.
- **ESM everywhere** (`"type": "module"`).
- TS strict + `noUncheckedIndexedAccess` + `verbatimModuleSyntax`, `moduleResolution: "Bundler"`.

## Dependencies — exact versions (latest stable)

- **Root (dev):** typescript 6.0.3, vitest 4.1.9, eslint 10.5.0, @eslint/js 10.0.1,
  typescript-eslint 8.62.0, prettier 3.8.4, concurrently 10.0.3.
- **server:** express 5.2.1, zod 4.4.3, nanoid 5.1.15 · dev: tsx 4.22.4, supertest 7.2.2,
  @types/express 5.0.6, @types/node 26.0.0, @types/supertest 7.2.0.
- **web:** react 19.2.7, react-dom 19.2.7, @reduxjs/toolkit 2.12.0, react-redux 9.3.0 ·
  dev: vite 8.1.0, @vitejs/plugin-react 6.0.3, jsdom 29.1.1, @testing-library/react 16.3.2,
  @testing-library/jest-dom 6.9.1, @testing-library/user-event 14.6.1, @types/react 19.2.17,
  @types/react-dom 19.2.3.

> Notes: Express 5, Zod 4, React 19, TypeScript 6 are all majors vs the earlier draft. Our
> code uses their stable surface; Express 5 also auto-forwards rejected promises from
> handlers (relevant in the Phase 4 proposal).

## Scripts (root)

- `dev` → `concurrently` runs server (`tsx watch`) + web (`vite`); Vite proxies `/api` → `:3000`.
- `test` → Vitest per workspace.
- `lint` → `eslint .` + `prettier --check .`.
- `build` → web `vite build` (server is typecheck-only).

## Draft (NOT final) — `tsconfig.base.json`

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

## Verification

- `npm install` resolves all three workspaces.
- `npm test` runs cleanly (no tests yet).
- `npx tsc -p server/tsconfig.json` and `-p web/tsconfig.json` exit 0; `npm run lint` clean.

## Confidence: 0.95

Versions are pinned exactly to latest stable (Express on 5.2.1). Approve and I'll
implement Phase 0; otherwise tell me which pin to change.

## Next proposals (one per task, after this lands)

`phase-1-shared-contract` → `phase-2-domain-core` → `phase-3-file-store` →
`phase-4-api` → `phase-5-web-data` → `phase-6-web-ui` → `phase-7-wire-up`.
