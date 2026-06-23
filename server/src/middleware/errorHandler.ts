import { ZodError } from 'zod';
import { DomainError } from '../domain/waitingList';
import { NotFoundError } from '../store/fileStore';
import type { ErrorRequestHandler } from 'express';

/** Central error mapping: validation/domain → 400, missing list → 404, else 500. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'invalid request', details: err.issues });
    return;
  }
  if (err instanceof DomainError) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'internal error' });
};
