import type { CohortBarProps } from './CohortBar.types';

/**
 * Renders cohorts as a row of boxes, newest on the left. The oldest (last) box is the
 * one served next on the following Take, so it is flagged.
 */
export function CohortBar({ cohorts, capacity }: CohortBarProps) {
  if (cohorts.length === 0) {
    return (
      <p
        data-testid='cohorts-empty'
        className='text-slate-500'
      >
        No cohorts yet
      </p>
    );
  }

  const lastIndex = cohorts.length - 1;
  return (
    <ol
      aria-label='cohorts'
      className='flex flex-wrap gap-2'
    >
      {cohorts.map((cohort, index) => {
        const servedNext = index === lastIndex;
        return (
          <li
            key={cohort.id}
            data-testid='cohort'
            className={`flex h-16 w-16 flex-col items-center justify-center rounded border ${
              servedNext ? 'border-amber-500 bg-amber-50' : 'border-slate-300 bg-white'
            }`}
          >
            <span className='text-lg font-semibold text-slate-800'>{cohort.count}</span>
            <span className='text-xs text-slate-400'>/{capacity}</span>
            {servedNext && <span className='text-[10px] font-medium text-amber-600'>next</span>}
          </li>
        );
      })}
    </ol>
  );
}
