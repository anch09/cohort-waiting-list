/**
 * Pure waiting-list rules. No IO, no clock, no randomness — those arrive via DomainDeps.
 *
 * Cohorts are an ordered deque stored NEWEST-FIRST (index 0 = newest/left).
 * Add tops up the newest cohort then opens new ones on the left; Take serves FIFO
 * from the oldest (array end). Only the two ends can ever be partial.
 */

import type { Cohort, WaitingList, WaitingListState, WaitingListSummary } from '@elective/shared';
import type { DomainDeps } from './waitingList.types';

export const DEFAULT_CAPACITY = 10;
export const DEFAULT_NAME = 'Untitled list';

/** Thrown on invalid domain input; mapped to HTTP 400 at the boundary. */
export class DomainError extends Error {}

export function create(
  deps: DomainDeps,
  input: { name?: string; capacity?: number } = {}
): WaitingList {
  const capacity = input.capacity ?? DEFAULT_CAPACITY;
  assertCapacity(capacity);
  const name = input.name ?? DEFAULT_NAME;
  assertName(name);

  const ts = deps.now();
  return {
    id: deps.id(),
    name,
    capacity,
    cohorts: [],
    nextSeq: 1,
    version: 1,
    createdAt: ts,
    updatedAt: ts
  };
}

export function add(deps: DomainDeps, list: WaitingList, n: number): WaitingList {
  assertCount(n);

  const ts = deps.now();
  const cohorts = list.cohorts.map(c => ({ ...c }));
  let nextSeq = list.nextSeq;
  let remaining = n;

  // 1. Top up the newest cohort if it is partial.
  const newest = cohorts[0];
  if (newest && newest.count < list.capacity) {
    const fill = Math.min(list.capacity - newest.count, remaining);
    newest.count += fill;
    newest.updatedAt = ts;
    remaining -= fill;
  }

  // 2. Open new cohorts on the left while creators remain.
  while (remaining > 0) {
    const chunk = Math.min(list.capacity, remaining);
    cohorts.unshift({ id: deps.id(), seq: nextSeq, count: chunk, createdAt: ts, updatedAt: ts });
    nextSeq += 1;
    remaining -= chunk;
  }

  return { ...list, cohorts, nextSeq, version: list.version + 1, updatedAt: ts };
}

export function take(
  deps: DomainDeps,
  list: WaitingList,
  n: number
): { list: WaitingList; taken: number } {
  assertCount(n);

  const ts = deps.now();
  const cohorts = list.cohorts.map(c => ({ ...c }));
  let remaining = n;
  let taken = 0;

  // Serve FIFO from the oldest end; drop a cohort the moment it empties.
  while (remaining > 0 && cohorts.length > 0) {
    const oldest = cohorts[cohorts.length - 1]!;
    const d = Math.min(oldest.count, remaining);
    oldest.count -= d;
    oldest.updatedAt = ts;
    remaining -= d;
    taken += d;
    if (oldest.count === 0) cohorts.pop();
  }

  // Nothing available → no change; return the list untouched so the store skips the write.
  if (taken === 0) return { list, taken: 0 };
  return { list: { ...list, cohorts, version: list.version + 1, updatedAt: ts }, taken };
}

export function total(list: WaitingList): number {
  return list.cohorts.reduce((sum, c) => sum + c.count, 0);
}

/** Map the persisted list to its wire state (drop `nextSeq`, add derived `total`). */
export function toState(list: WaitingList): WaitingListState {
  const { nextSeq: _nextSeq, ...rest } = list;
  return { ...rest, total: total(list) };
}

export function toSummary(list: WaitingList): WaitingListSummary {
  return {
    id: list.id,
    name: list.name,
    capacity: list.capacity,
    total: total(list),
    version: list.version
  };
}

function assertCount(n: number): void {
  if (!Number.isInteger(n) || n < 1) {
    throw new DomainError('count must be an integer >= 1');
  }
}

function assertCapacity(capacity: number): void {
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new DomainError('capacity must be an integer >= 1');
  }
}

function assertName(name: string): void {
  if (typeof name !== 'string' || name.trim() === '') {
    throw new DomainError('name must be a non-empty string');
  }
}

export type { Cohort };
