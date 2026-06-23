import { Router } from 'express';
import { makeWaitingListsController } from '../controllers/waitingLists.controller';
import type { ListStore } from '../store/fileStore.types';

/** Express 5 forwards rejected handler promises to the error middleware automatically. */
export function waitingListsRouter(store: ListStore): Router {
  const c = makeWaitingListsController(store);
  const router = Router();

  router.get('/', c.list);
  router.post('/', c.create);
  router.get('/:id', c.get);
  router.post('/:id/add', c.add);
  router.post('/:id/take', c.take);
  router.get('/:id/total', c.total);

  return router;
}
