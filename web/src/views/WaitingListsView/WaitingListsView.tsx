import { useState, type FormEvent } from 'react';
import {
  useAddCreatorsMutation,
  useCreateListMutation,
  useGetListQuery,
  useGetListsQuery,
  useTakeCreatorsMutation
} from '../../api/waitingLists/waitingLists.api';
import { CohortBar } from '../../components/CohortBar/CohortBar';
import { NumberField } from '../../components/NumberField/NumberField';

/** The single screen: a sidebar of lists + create form, and the active list's controls. */
export function WaitingListsView() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [served, setServed] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('10');

  const { data: lists = [] } = useGetListsQuery();
  const { data: active } = useGetListQuery(activeId ?? '', { skip: activeId === null });
  const [createList, { isLoading: isCreating }] = useCreateListMutation();
  const [addCreators, { isLoading: isAdding }] = useAddCreatorsMutation();
  const [takeCreators, { isLoading: isTaking }] = useTakeCreatorsMutation();

  // Capacity is optional: blank → omit it and let the server default to 10. A non-blank value
  // must be a whole number >= 1, so we never send something the API rejects.
  const capacityTrimmed = capacity.trim();
  const capacityBlank = capacityTrimmed === '';
  const capacityValid =
    capacityBlank || (/^\d+$/.test(capacityTrimmed) && Number.parseInt(capacityTrimmed, 10) >= 1);
  const capacityError = capacityValid ? '' : 'Capacity must be a whole number ≥ 1';

  function select(id: string) {
    setActiveId(id);
    setServed(null);
    setActionError(null);
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!capacityValid || isCreating) return;
    try {
      const created = await createList({
        name: name.trim() || undefined,
        capacity: capacityBlank ? undefined : Number.parseInt(capacityTrimmed, 10)
      }).unwrap();
      setName('');
      select(created.id);
    } catch {
      setActionError('Could not create the list. Please try again.');
    }
  }

  async function handleAdd(count: number) {
    if (activeId === null) return;
    try {
      await addCreators({ id: activeId, count }).unwrap();
      setServed(null);
      setActionError(null);
    } catch {
      setActionError('Could not add creators. Please try again.');
    }
  }

  async function handleTake(count: number) {
    if (activeId === null) return;
    try {
      const result = await takeCreators({ id: activeId, count }).unwrap();
      setServed(result.taken);
      setActionError(null);
    } catch {
      setActionError('Could not take creators. Please try again.');
    }
  }

  return (
    <div className='mx-auto max-w-4xl p-6'>
      {actionError !== null && (
        <p
          role='alert'
          className='mb-4 rounded bg-red-50 px-3 py-2 text-red-700'
        >
          {actionError}
        </p>
      )}
      <div className='flex gap-8'>
        <aside className='w-64 shrink-0'>
          <h2 className='mb-2 text-sm font-semibold tracking-wide text-slate-500 uppercase'>
            Lists
          </h2>
          <ul className='mb-4 space-y-1'>
            {lists.map(list => (
              <li key={list.id}>
                <button
                  type='button'
                  onClick={() => select(list.id)}
                  aria-current={list.id === activeId}
                  className='flex w-full justify-between rounded px-2 py-1 text-left hover:bg-slate-100 aria-[current=true]:bg-slate-200'
                >
                  <span>{list.name}</span>
                  <span className='text-slate-500'>{list.total}</span>
                </button>
              </li>
            ))}
          </ul>

          <form
            onSubmit={handleCreate}
            className='space-y-2 border-t border-slate-200 pt-4'
          >
            <input
              aria-label='List name'
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder='New list name'
              className='w-full rounded border border-slate-300 px-2 py-1'
            />
            <input
              aria-label='Capacity'
              inputMode='numeric'
              value={capacity}
              onChange={event => setCapacity(event.target.value)}
              placeholder='Defaults to 10'
              aria-invalid={!capacityValid}
              className='w-full rounded border border-slate-300 px-2 py-1'
            />
            {capacityError !== '' && (
              <span
                role='alert'
                className='block text-sm text-red-600'
              >
                {capacityError}
              </span>
            )}
            <button
              type='submit'
              disabled={!capacityValid || isCreating}
              className='w-full rounded bg-slate-900 px-3 py-1.5 text-white disabled:opacity-40'
            >
              Create list
            </button>
          </form>
        </aside>

        <main className='flex-1'>
          {active === undefined ? (
            <p className='text-slate-500'>Select or create a list to begin.</p>
          ) : (
            <>
              <h1 className='text-xl font-semibold text-slate-900'>{active.name}</h1>
              <p className='mt-1 mb-4 text-slate-600'>
                Total waiting: <strong className='text-slate-900'>{active.total}</strong>
              </p>
              <CohortBar
                cohorts={active.cohorts}
                capacity={active.capacity}
              />
              <div className='mt-6 flex gap-8'>
                <NumberField
                  label='Add'
                  submitLabel='Add'
                  onSubmit={handleAdd}
                  disabled={isAdding}
                />
                <NumberField
                  label='Take'
                  submitLabel='Take'
                  onSubmit={handleTake}
                  disabled={isTaking || active.total === 0}
                  note={
                    active.total === 0
                      ? 'Nothing waiting to take yet.'
                      : `Up to ${active.total} available.`
                  }
                />
              </div>
              {served !== null && (
                <p
                  role='status'
                  className='mt-4 text-slate-700'
                >
                  Served {served}
                </p>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
