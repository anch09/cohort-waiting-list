---
name: propose
description: Draft a short, structured proposal (goal, approach, impacted files, confidence) before writing code. No implementation.
disable-model-invocation: true
argument-hint: '<task description>'
---

# Propose

Plan before code. Do **NOT** implement.

1. Restate the goal in one line.
2. Note assumptions and open questions.
3. List impacted files / areas.
4. Give the approach (one alternative only if it matters); recommend one.
5. List the tests to write first (TDD), then an **implementation sketch** — shapes and
   signatures, not final code. Add a small mermaid diagram if it clarifies flow.
6. Confidence (0.0–1.0). If < 0.9, ask the fewest questions needed to raise it.

Honor `CLAUDE.md` (pure core, `shared/` contract, RTK Query, Zod, domain invariant).

Write the proposal to `ai-sessions/<slug>.md` (slug = 3–5 words from the task).
In chat print only: the file path, the one-line goal, the approach, the confidence —
then stop and wait for `/refine` or approval to implement.

Task: $ARGUMENTS
