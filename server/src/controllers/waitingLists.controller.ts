import { nanoid } from 'nanoid';
import * as domain from '../domain/waitingList';
import { countSchema, createListSchema } from '../schemas/waitingLists.schema';
import { NotFoundError } from '../store/fileStore';
import type { Request, Response } from 'express';
import type { WaitingList } from '@elective/shared';
import type { DomainDeps } from '../domain/waitingList.types';
import type { ListStore } from '../store/fileStore.types';

const deps: DomainDeps = { now: () => new Date().toISOString(), id: () => nanoid() };

/** Thin HTTP handlers: validate input, run a domain op through the store, send the DTO. */
export function makeWaitingListsController(store: ListStore) {
  async function loadOr404(id: string): Promise<WaitingList> {
    const list = await store.load(id);
    if (!list) throw new NotFoundError(`waiting list ${id} not found`);
    return list;
  }

  return {
    async list(_req: Request, res: Response): Promise<void> {
      const lists = await store.enumerate();
      res.json(lists.map(domain.toSummary));
    },

    async create(req: Request, res: Response): Promise<void> {
      const input = createListSchema.parse(req.body);
      const list = domain.create(deps, input);
      await store.save(list);
      res.status(201).json(domain.toState(list));
    },

    async get(req: Request, res: Response): Promise<void> {
      const list = await loadOr404(req.params.id as string);
      res.json(domain.toState(list));
    },

    async add(req: Request, res: Response): Promise<void> {
      const { count } = countSchema.parse(req.body);
      const { list } = await store.withList(req.params.id as string, cur => ({
        list: domain.add(deps, cur, count)
      }));
      res.json(domain.toState(list));
    },

    async take(req: Request, res: Response): Promise<void> {
      const { count } = countSchema.parse(req.body);
      const { list, taken } = await store.withList(req.params.id as string, cur =>
        domain.take(deps, cur, count)
      );
      res.json({ taken, state: domain.toState(list) });
    },

    async total(req: Request, res: Response): Promise<void> {
      const list = await loadOr404(req.params.id as string);
      res.json({ total: domain.total(list) });
    }
  };
}
