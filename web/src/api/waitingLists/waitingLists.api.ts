import { baseApi, LIST_ID, WAITING_LIST_TAG } from '../baseApi';
import type { CreateListArg, MutateCountArg } from './waitingLists.types';
import type { ListResponse, ListsResponse, TakeResponse, TotalResponse } from '@elective/shared';

/** Endpoints for the waiting-lists resource, with cache-tag wiring (architecture §5). */
export const waitingListsApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getLists: builder.query<ListsResponse, void>({
      query: () => 'waiting-lists',
      providesTags: [{ type: WAITING_LIST_TAG, id: LIST_ID }]
    }),
    getList: builder.query<ListResponse, string>({
      query: id => `waiting-lists/${id}`,
      providesTags: (_res, _err, id) => [{ type: WAITING_LIST_TAG, id }]
    }),
    getTotal: builder.query<TotalResponse, string>({
      query: id => `waiting-lists/${id}/total`,
      providesTags: (_res, _err, id) => [{ type: WAITING_LIST_TAG, id }]
    }),
    createList: builder.mutation<ListResponse, CreateListArg>({
      query: body => ({ url: 'waiting-lists', method: 'POST', body }),
      invalidatesTags: [{ type: WAITING_LIST_TAG, id: LIST_ID }]
    }),
    addCreators: builder.mutation<ListResponse, MutateCountArg>({
      query: ({ id, count }) => ({
        url: `waiting-lists/${id}/add`,
        method: 'POST',
        body: { count }
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: WAITING_LIST_TAG, id },
        { type: WAITING_LIST_TAG, id: LIST_ID }
      ]
    }),
    takeCreators: builder.mutation<TakeResponse, MutateCountArg>({
      query: ({ id, count }) => ({
        url: `waiting-lists/${id}/take`,
        method: 'POST',
        body: { count }
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: WAITING_LIST_TAG, id },
        { type: WAITING_LIST_TAG, id: LIST_ID }
      ]
    })
  })
});

export const {
  useGetListsQuery,
  useGetListQuery,
  useGetTotalQuery,
  useCreateListMutation,
  useAddCreatorsMutation,
  useTakeCreatorsMutation
} = waitingListsApi;
