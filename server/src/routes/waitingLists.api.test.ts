import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { createFileStore } from '../store/fileStore';
import type { Express } from 'express';

const countsOf = (cohorts: Array<{ count: number }>): number[] => cohorts.map(c => c.count);

describe('waiting lists API', () => {
  let dir: string;
  let app: Express;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'wl-api-'));
    app = createApp(createFileStore(dir));
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  const createList = (body: Record<string, unknown> = {}) =>
    request(app).post('/api/waiting-lists').send(body);
  const addTo = (id: string, count: number) =>
    request(app).post(`/api/waiting-lists/${id}/add`).send({ count });
  const takeFrom = (id: string, count: number) =>
    request(app).post(`/api/waiting-lists/${id}/take`).send({ count });

  it('creates a list with default capacity and no internal fields', async () => {
    const res = await createList();
    expect(res.status).toBe(201);
    expect(res.body.capacity).toBe(10);
    expect(res.body.total).toBe(0);
    expect(res.body).not.toHaveProperty('nextSeq');
  });

  it('replays the brief flow over HTTP', async () => {
    const { body: list } = await createList({ capacity: 10 });
    const id = list.id as string;

    expect(countsOf((await addTo(id, 3)).body.cohorts)).toEqual([3]);
    expect(countsOf((await addTo(id, 13)).body.cohorts)).toEqual([6, 10]);
    expect(countsOf((await addTo(id, 22)).body.cohorts)).toEqual([8, 10, 10, 10]);

    const t4 = await takeFrom(id, 4);
    expect(t4.body.taken).toBe(4);
    expect(countsOf(t4.body.state.cohorts)).toEqual([8, 10, 10, 6]);

    expect(countsOf((await takeFrom(id, 7)).body.state.cohorts)).toEqual([8, 10, 9]);
    expect((await request(app).get(`/api/waiting-lists/${id}/total`)).body.total).toBe(27);
  });

  it('lists compact summaries (no cohorts)', async () => {
    await createList({ name: 'A' });
    await createList({ name: 'B' });
    const res = await request(app).get('/api/waiting-lists');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty('total');
    expect(res.body[0]).not.toHaveProperty('cohorts');
  });

  it('rejects add 0 / take 0 with 400', async () => {
    const { body } = await createList();
    expect((await addTo(body.id, 0)).status).toBe(400);
    expect((await takeFrom(body.id, 0)).status).toBe(400);
  });

  it('rejects invalid count and capacity with 400', async () => {
    const { body } = await createList();
    expect((await addTo(body.id, -1)).status).toBe(400);
    expect((await addTo(body.id, 1.5)).status).toBe(400);
    expect((await createList({ capacity: 0 })).status).toBe(400);
  });

  it('clamps take to available and reports taken', async () => {
    const { body } = await createList({ capacity: 10 });
    await addTo(body.id, 5);
    const res = await takeFrom(body.id, 99);
    expect(res.body.taken).toBe(5);
    expect(res.body.state.cohorts).toEqual([]);
  });

  it('returns 404 for an unknown list', async () => {
    expect((await request(app).get('/api/waiting-lists/nope')).status).toBe(404);
    expect((await addTo('nope', 1)).status).toBe(404);
  });
});
