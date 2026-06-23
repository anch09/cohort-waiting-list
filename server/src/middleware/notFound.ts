import type { RequestHandler } from 'express';

/** Catches unmatched routes. */
export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'not found' });
};
