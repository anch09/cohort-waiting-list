/** Domain entities — the persisted shape of a waiting list and its cohorts. */

export type Cohort = {
  /** Stable unique id. */
  id: string;
  /** Monotonic creation label; lower = older = served sooner. */
  seq: number;
  /** Live creator tally. Invariant: 1 <= count <= list.capacity. */
  count: number;
  createdAt: string;
  updatedAt: string;
};

export type WaitingList = {
  /** Server-assigned id. */
  id: string;
  /** Human display label; set at creation, non-unique. */
  name: string;
  /** Per-cohort max; integer >= 1. Fixed for the life of the list. */
  capacity: number;
  /** Stored NEWEST-FIRST: index 0 = left/newest, last = oldest (served next). */
  cohorts: Cohort[];
  /** Next cohort label to hand out; only ever increases. */
  nextSeq: number;
  /** Monotonic; bumped on every mutation. */
  version: number;
  createdAt: string;
  updatedAt: string;
};
