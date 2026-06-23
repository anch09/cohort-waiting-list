import { Router } from 'express';
import { waitingListsRouter } from './waitingLists.routes';
import type { ListStore } from '../store/fileStore.types';

/** Mounts resources under /api and exposes a health check. */
export function apiRouter(store: ListStore): Router {
  const router = Router();
  router.get('/health', (_req, res) => {
    res.json({ ok: true });
  });
  router.use('/waiting-lists', waitingListsRouter(store));
  return router;
}
