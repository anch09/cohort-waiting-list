---
session: phase-7-wireup
date: 2026-06-23
status: approved
---

# Proposal — Phase 7 · Wire-up & polish

## Goal

Make the app runnable end-to-end and documented, then verify the real
browser → Express → disk round-trip by hand. Closes out the build.

## Scope (dev-only — prod one-port serving dropped per decision)

1. **Dev** — confirm `npm run dev` runs Vite + Express together (`concurrently`), Vite
   proxying `/api` → `:3000`. Already wired in root `package.json` + `web/vite.config.ts`;
   this phase verifies it. The web is served by Vite; Express stays API-only.
2. **README.md** — quick start, scripts, how it works, structure, and links to the design
   docs + the AI-usage writeup (`docs/ai-usage.md`, required by the brief).
3. **Smoke test** — run the server, replay the brief flow over HTTP, confirm `data/<id>.json`
   files are written (the live round-trip the Supertest suite mocks the disk for).

## Decisions baked in

- **No prod static serving** — running is `npm run dev`. `index.ts` stays API-only.
- **No new code or deps** beyond the README; the server/web are already complete.

## Files

```
README.md   new — run/test instructions, structure, doc + AI-usage links
```

## Verification

- `npm test` green (server + web); `npm run lint` clean; `npm run build` clean.
- Live smoke: start the server, `POST/GET` the brief flow (`create → add → take → total`),
  confirm responses match and `data/*.json` is written; `take 0` → 400; unknown → 404.

## Confidence: 0.95

No automated tests to add (this is docs + a manual/live check). Approve and I'll write the
README and run the smoke test — that's the build done.
