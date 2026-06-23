import { mkdtemp, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { add, create, take, total } from '../domain/waitingList';
import { createFileStore, NotFoundError } from './fileStore';
import type { DomainDeps } from '../domain/waitingList.types';
import type { ListStore } from './fileStore.types';

function deps(): DomainDeps {
  let n = 0;
  return { now: () => new Date(0).toISOString(), id: () => `id-${++n}` };
}
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

describe('fileStore', () => {
  let dir: string;
  let store: ListStore;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'wl-store-'));
    store = createFileStore(dir);
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('round-trips save and load', async () => {
    const list = create(deps(), { capacity: 5 });
    await store.save(list);
    expect(await store.load(list.id)).toEqual(list);
  });

  it('returns null for an unknown id', async () => {
    expect(await store.load('nope')).toBeNull();
  });

  it('enumerates saved lists', async () => {
    const d = deps();
    const a = create(d, {});
    const b = create(d, {});
    await store.save(a);
    await store.save(b);
    const ids = (await store.enumerate()).map(l => l.id).sort();
    expect(ids).toEqual([a.id, b.id].sort());
  });

  it('leaves no .tmp files behind (atomic write)', async () => {
    await store.save(create(deps(), {}));
    const files = await readdir(dir);
    expect(files.every(f => f.endsWith('.json'))).toBe(true);
  });

  it('withList applies the domain op and persists it', async () => {
    const d = deps();
    const list = create(d, { capacity: 10 });
    await store.save(list);
    const { list: next } = await store.withList(list.id, cur => ({ list: add(d, cur, 5) }));
    expect(total(next)).toBe(5);
    expect(total((await store.load(list.id))!)).toBe(5);
  });

  it('withList rejects an unknown id with NotFoundError', async () => {
    await expect(store.withList('nope', l => ({ list: l }))).rejects.toBeInstanceOf(NotFoundError);
  });

  it('serializes concurrent mutations without lost updates', async () => {
    const d = deps();
    const list = create(d, { capacity: 1000 });
    await store.save(list);
    await Promise.all(
      Array.from({ length: 50 }, () => store.withList(list.id, cur => ({ list: add(d, cur, 1) })))
    );
    expect(total((await store.load(list.id))!)).toBe(50);
  });

  it('skips the write when nothing changes (persist-on-change)', async () => {
    const list = create(deps(), {}); // empty, version 1
    await store.save(list);
    const file = join(dir, `${list.id}.json`);
    const before = (await stat(file)).mtimeMs;
    await sleep(10);
    const res = await store.withList(list.id, cur => take(deps(), cur, 5)); // no-op
    expect(res.taken).toBe(0);
    expect((await stat(file)).mtimeMs).toBe(before);
  });
});
