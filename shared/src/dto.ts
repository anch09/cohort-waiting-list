/** Wire contract — request/response shapes shared by server and web. */

import type { Cohort, WaitingList } from './entities';

/** Full list state returned to the client. Internal `nextSeq` is omitted; `total` is derived. */
export type WaitingListState = Omit<WaitingList, 'nextSeq'> & { total: number };

/** Compact row for the collection view. */
export type WaitingListSummary = {
  id: string;
  name: string;
  capacity: number;
  total: number;
  version: number;
};

export type { Cohort, WaitingList };

// --- Requests ---
export type CreateListRequest = { name?: string; capacity?: number };
export type CountRequest = { count: number };

// --- Responses ---
export type ListsResponse = WaitingListSummary[];
export type ListResponse = WaitingListState;
export type TakeResponse = { taken: number; state: WaitingListState };
export type TotalResponse = { total: number };
