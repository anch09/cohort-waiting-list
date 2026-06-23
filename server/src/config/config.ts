import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT ?? 3000),
  /** Where list JSON files live. Defaults to <repo>/data. */
  dataDir: process.env.DATA_DIR ?? resolve(here, '../../../data'),
  defaultCapacity: 10
};
