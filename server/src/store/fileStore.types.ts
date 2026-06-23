import type { WaitingList } from '@elective/shared';

/** Persistence port: enumerate, load, save, and serialized read-modify-write. */
export type ListStore = {
  enumerate(): Promise<WaitingList[]>;
  load(id: string): Promise<WaitingList | null>;
  save(list: WaitingList): Promise<WaitingList>;
  /**
   * Load the list, apply `fn`, and atomically persist `fn`'s `list` — but only if the
   * domain changed it (`version` bumped). Runs under a per-id mutex. Returns whatever
   * `fn` returns (e.g. `{ list, taken }`). Rejects with NotFoundError if the id is unknown.
   */
  withList<T extends { list: WaitingList }>(
    id: string,
    fn: (current: WaitingList) => T
  ): Promise<T>;
};
