import type { CreateListRequest } from '@elective/shared';

/** Args for `createList`. */
export type CreateListArg = CreateListRequest;

/** Args for the `addCreators` / `takeCreators` mutations. */
export type MutateCountArg = { id: string; count: number };
