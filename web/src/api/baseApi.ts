import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/** Cache tag type and the synthetic id used for the collection (list of lists). */
export const WAITING_LIST_TAG = 'WaitingList' as const;
export const LIST_ID = 'LIST' as const;

/**
 * Single RTK Query API. Endpoints are injected per resource (`api/<resource>/`).
 * Queries provide tags; mutations invalidate them → automatic refetch (architecture §5).
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: [WAITING_LIST_TAG],
  endpoints: () => ({})
});
