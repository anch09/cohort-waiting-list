import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useAddCreatorsMutation,
  useCreateListMutation,
  useGetListQuery,
  useGetListsQuery,
  useTakeCreatorsMutation
} from '../../api/waitingLists/waitingLists.api';
import { WaitingListsView } from './WaitingListsView';
import type { ListResponse, TakeResponse } from '@elective/shared';

vi.mock('../../api/waitingLists/waitingLists.api');

const listState: ListResponse = {
  id: 'l1',
  name: 'Creators',
  capacity: 10,
  version: 1,
  createdAt: '',
  updatedAt: '',
  total: 18,
  cohorts: [
    { id: 'c2', seq: 2, count: 8, createdAt: '', updatedAt: '' },
    { id: 'c1', seq: 1, count: 10, createdAt: '', updatedAt: '' }
  ]
};
const emptyState: ListResponse = { ...listState, total: 0, cohorts: [] };

/** Loose query-hook result; cast at the call site to satisfy the hook's complex type. */
const queryResult = (data: unknown) => ({ data, refetch: vi.fn() });

/** A mutation hook result: `[trigger, state]`. Cast to `never` so it fits any mutation hook. */
const mutation = (trigger: ReturnType<typeof vi.fn>) =>
  [trigger, { isLoading: false }] as unknown as never;

const createTrigger = vi.fn(() => ({ unwrap: () => Promise.resolve({ ...listState, id: 'l2' }) }));
const addTrigger = vi.fn(() => ({ unwrap: () => Promise.resolve(listState) }));
const takeTrigger = vi.fn(() => ({
  unwrap: () => Promise.resolve<TakeResponse>({ taken: 4, state: listState })
}));

/** getList returns nothing while skipped (no active list), the state otherwise. */
function mockActiveList(state: ListResponse) {
  vi.mocked(useGetListQuery).mockImplementation(((_id: string, opts?: { skip?: boolean }) =>
    queryResult(opts?.skip ? undefined : state)) as unknown as typeof useGetListQuery);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useGetListsQuery).mockReturnValue(
    queryResult([{ id: 'l1', name: 'Creators', capacity: 10, total: 18, version: 1 }]) as never
  );
  mockActiveList(listState);
  vi.mocked(useCreateListMutation).mockReturnValue(mutation(createTrigger));
  vi.mocked(useAddCreatorsMutation).mockReturnValue(mutation(addTrigger));
  vi.mocked(useTakeCreatorsMutation).mockReturnValue(mutation(takeTrigger));
});

const selectCreators = () => userEvent.click(screen.getByRole('button', { name: /Creators/ }));

describe('WaitingListsView', () => {
  it('prompts to select or create until a list is active', () => {
    render(<WaitingListsView />);
    expect(screen.getByText('Select or create a list to begin.')).toBeInTheDocument();
  });

  it('renders the active list total and cohorts after selecting', async () => {
    render(<WaitingListsView />);
    await selectCreators();
    expect(screen.getByText('Total waiting:')).toHaveTextContent('18');
    expect(screen.getAllByTestId('cohort').map(b => b.firstChild?.textContent)).toEqual([
      '8',
      '10'
    ]);
  });

  it('adds creators to the selected list with the right args', async () => {
    render(<WaitingListsView />);
    await selectCreators();
    await userEvent.type(screen.getByLabelText('Add'), '3');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(addTrigger).toHaveBeenCalledWith({ id: 'l1', count: 3 });
  });

  it('reports the server-reported served count, even when fewer than requested (over-take)', async () => {
    vi.mocked(useTakeCreatorsMutation).mockReturnValue(
      mutation(
        vi.fn(() => ({
          unwrap: () => Promise.resolve<TakeResponse>({ taken: 10, state: emptyState })
        }))
      )
    );
    render(<WaitingListsView />);
    await selectCreators();
    await userEvent.type(screen.getByLabelText('Take'), '99');
    await userEvent.click(screen.getByRole('button', { name: 'Take' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Served 10');
  });

  it('creates a list and makes it active', async () => {
    render(<WaitingListsView />);
    expect(screen.getByText('Select or create a list to begin.')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('List name'), 'New');
    await userEvent.click(screen.getByRole('button', { name: 'Create list' }));
    expect(createTrigger).toHaveBeenCalledWith({ name: 'New', capacity: 10 });
    expect(await screen.findByText('Total waiting:')).toBeInTheDocument();
    expect(screen.queryByText('Select or create a list to begin.')).toBeNull();
  });

  it('blocks create and explains when the capacity is invalid', async () => {
    render(<WaitingListsView />);
    const capacity = screen.getByLabelText('Capacity');
    await userEvent.clear(capacity);
    await userEvent.type(capacity, '0');
    expect(screen.getByText('Capacity must be a whole number ≥ 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create list' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Create list' }));
    expect(createTrigger).not.toHaveBeenCalled();
  });

  it('treats a blank capacity as the default (10) and hints it', async () => {
    render(<WaitingListsView />);
    const capacity = screen.getByLabelText('Capacity');
    await userEvent.clear(capacity);
    expect(capacity).toHaveAttribute('placeholder', 'Defaults to 10');
    expect(screen.queryByText('Capacity must be a whole number ≥ 1')).toBeNull();
    await userEvent.type(screen.getByLabelText('List name'), 'New');
    await userEvent.click(screen.getByRole('button', { name: 'Create list' }));
    expect(createTrigger).toHaveBeenCalledWith({ name: 'New', capacity: undefined });
  });

  it('shows an empty placeholder for a list with no cohorts', async () => {
    mockActiveList(emptyState);
    render(<WaitingListsView />);
    await selectCreators();
    expect(screen.getByText('Total waiting:')).toHaveTextContent('0');
    expect(screen.getByTestId('cohorts-empty')).toBeInTheDocument();
  });

  it('surfaces an error when a mutation fails', async () => {
    vi.mocked(useTakeCreatorsMutation).mockReturnValue(
      mutation(vi.fn(() => ({ unwrap: () => Promise.reject(new Error('boom')) })))
    );
    render(<WaitingListsView />);
    await selectCreators();
    await userEvent.type(screen.getByLabelText('Take'), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Take' }));
    expect(
      await screen.findByText('Could not take creators. Please try again.')
    ).toBeInTheDocument();
  });
});
