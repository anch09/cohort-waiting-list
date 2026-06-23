import { describe, expect, it } from 'vitest';
import { add, create, DomainError, take, toState, total } from './waitingList';
import type { DomainDeps } from './waitingList.types';
import type { WaitingList } from '@elective/shared';

/** Deterministic deps: fixed clock, incrementing ids. */
function testDeps(): DomainDeps {
  let n = 0;
  return { now: () => '2026-01-01T00:00:00.000Z', id: () => `id-${++n}` };
}

const counts = (list: WaitingList): number[] => list.cohorts.map(c => c.count);
const make = (capacity = 10): WaitingList => create(testDeps(), { capacity });

describe('create', () => {
  it('starts empty with defaults', () => {
    const list = create(testDeps());
    expect(list.capacity).toBe(10);
    expect(list.cohorts).toEqual([]);
    expect(list.nextSeq).toBe(1);
    expect(list.version).toBe(1);
  });

  it('rejects a non-integer or < 1 capacity', () => {
    expect(() => create(testDeps(), { capacity: 0 })).toThrow(DomainError);
    expect(() => create(testDeps(), { capacity: 2.5 })).toThrow(DomainError);
  });

  it('rejects a blank name', () => {
    expect(() => create(testDeps(), { name: '   ' })).toThrow(DomainError);
  });
});

describe('the brief example flow (capacity 10)', () => {
  it('replays add/take/total end to end', () => {
    const deps = testDeps();
    let list = create(deps, { capacity: 10 });

    list = add(deps, list, 3);
    expect(counts(list)).toEqual([3]);

    list = add(deps, list, 13);
    expect(counts(list)).toEqual([6, 10]);

    list = add(deps, list, 22);
    expect(counts(list)).toEqual([8, 10, 10, 10]);

    ({ list } = take(deps, list, 4));
    expect(counts(list)).toEqual([8, 10, 10, 6]);

    const t7 = take(deps, list, 7);
    list = t7.list;
    expect(counts(list)).toEqual([8, 10, 9]);
    expect(t7.taken).toBe(7);
    expect(total(list)).toBe(27);

    ({ list } = take(deps, list, 20));
    expect(counts(list)).toEqual([7]);
    expect(total(list)).toBe(7);
  });
});

describe('add', () => {
  it('rejects count < 1 or non-integer', () => {
    expect(() => add(testDeps(), make(), 0)).toThrow(DomainError);
    expect(() => add(testDeps(), make(), -1)).toThrow(DomainError);
    expect(() => add(testDeps(), make(), 1.5)).toThrow(DomainError);
  });

  it('tops up the partial left cohort before opening new ones', () => {
    const deps = testDeps();
    const list = add(deps, add(deps, make(), 6), 7);
    expect(counts(list)).toEqual([3, 10]);
  });

  it('supports capacity 1', () => {
    const list = add(testDeps(), make(1), 3);
    expect(counts(list)).toEqual([1, 1, 1]);
  });

  it('bumps version on a real add', () => {
    const list = make();
    expect(add(testDeps(), list, 1).version).toBe(list.version + 1);
  });
});

describe('take', () => {
  it('rejects count < 1 or non-integer', () => {
    const list = add(testDeps(), make(), 5);
    expect(() => take(testDeps(), list, 0)).toThrow(DomainError);
    expect(() => take(testDeps(), list, -1)).toThrow(DomainError);
    expect(() => take(testDeps(), list, 1.5)).toThrow(DomainError);
  });

  it('taking exactly the total empties the list', () => {
    const deps = testDeps();
    const list = add(deps, make(), 15); // [5, 10], total 15
    const res = take(deps, list, 15);
    expect(res.taken).toBe(15);
    expect(res.list.cohorts).toEqual([]);
  });

  it('taking more than total clamps and drains everything', () => {
    const deps = testDeps();
    const list = add(deps, make(), 15);
    const res = take(deps, list, 999);
    expect(res.taken).toBe(15);
    expect(res.list.cohorts).toEqual([]);
  });

  it('taking from an empty list yields taken 0 and no change (version unchanged)', () => {
    const list = make();
    const res = take(testDeps(), list, 5);
    expect(res.taken).toBe(0);
    expect(res.list).toBe(list); // same reference → nothing changed → store skips write
    expect(res.list.version).toBe(list.version);
  });

  it('removes an emptied cohort (never persists count 0)', () => {
    const deps = testDeps();
    const list = add(deps, make(1), 2); // [1, 1]
    const res = take(deps, list, 1);
    expect(counts(res.list)).toEqual([1]);
    expect(res.list.cohorts.every(c => c.count > 0)).toBe(true);
  });
});

describe('seq', () => {
  it('keeps climbing after older cohorts are removed', () => {
    const deps = testDeps();
    let list = add(deps, make(), 10); // cohort seq 1
    expect(list.cohorts[0]!.seq).toBe(1);

    ({ list } = take(deps, list, 10)); // cohort removed
    list = add(deps, list, 5); // new cohort must NOT reuse seq 1
    expect(list.cohorts[0]!.seq).toBe(2);
    expect(list.nextSeq).toBe(3);
  });
});

describe('toState', () => {
  it('drops nextSeq and adds derived total', () => {
    const list = add(testDeps(), make(), 12);
    const state = toState(list);
    expect(state.total).toBe(12);
    expect('nextSeq' in state).toBe(false);
  });
});
