---
name: refine
description: Update the latest proposal from feedback. Still no implementation.
disable-model-invocation: true
argument-hint: '<feedback>'
---

# Refine

Iterate on the proposal. Do **NOT** implement.

1. Read the most recent file in `ai-sessions/` (if several could match, ask which).
2. Summarize the feedback in one or two lines.
3. Update the approach, draft, risks, and confidence; overwrite the file.

In chat print only: what changed (bullets) and the new confidence — then wait for
another `/refine` or approval to implement.

Feedback: $ARGUMENTS
