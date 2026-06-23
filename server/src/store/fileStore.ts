/**
 * JSON file persistence: one `<id>.json` per list under `dataDir`.
 * Writes are atomic (tmp → rename), every read-modify-write runs under a per-id mutex,
 * and a mutation that changes nothing (no `version` bump) skips the write entirely.
 */

import { mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { nanoid } from 'nanoid';
import type { WaitingList } from '@elective/shared';
import type { ListStore } from './fileStore.types';

/** Thrown when a list id does not exist; mapped to HTTP 404 at the boundary. */
export class NotFoundError extends Error {}

export function createFileStore(dataDir: string): ListStore {
  const pathFor = (id: string) => join(dataDir, `${id}.json`);
  const ensureDir = () => mkdir(dataDir, { recursive: true });
  const run = createMutex();

  async function load(id: string): Promise<WaitingList | null> {
    try {
      return JSON.parse(await readFile(pathFor(id), 'utf8')) as WaitingList;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }

  async function save(list: WaitingList): Promise<WaitingList> {
    await ensureDir();
    const target = pathFor(list.id);
    const tmp = `${target}.${nanoid()}.tmp`;
    await writeFile(tmp, JSON.stringify(list, null, 2), 'utf8');
    await rename(tmp, target);
    return list;
  }

  async function enumerate(): Promise<WaitingList[]> {
    await ensureDir();
    const files = (await readdir(dataDir)).filter(f => f.endsWith('.json'));
    return Promise.all(
      files.map(async f => JSON.parse(await readFile(join(dataDir, f), 'utf8')) as WaitingList)
    );
  }

  function withList<T extends { list: WaitingList }>(
    id: string,
    fn: (current: WaitingList) => T
  ): Promise<T> {
    return run(id, async () => {
      const current = await load(id);
      if (!current) throw new NotFoundError(`waiting list ${id} not found`);
      const result = fn(current);
      // Persist only when the domain actually changed the list.
      if (result.list.version !== current.version) await save(result.list);
      return result;
    });
  }

  return { enumerate, load, save, withList };
}

/** Serializes async tasks per key by chaining them onto a per-key promise. */
function createMutex() {
  const chains = new Map<string, Promise<unknown>>();
  return function run<T>(key: string, task: () => Promise<T>): Promise<T> {
    const prev = chains.get(key) ?? Promise.resolve();
    const next = prev.then(task, task);
    chains.set(
      key,
      next.then(
        () => undefined,
        () => undefined
      )
    );
    return next;
  };
}
