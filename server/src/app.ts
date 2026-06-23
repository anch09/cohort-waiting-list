import express from 'express';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { apiRouter } from './routes';
import type { Express } from 'express';
import type { ListStore } from './store/fileStore.types';

/** Build the Express app around a store. No `listen` here — keeps it testable. */
export function createApp(store: ListStore): Express {
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter(store));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
