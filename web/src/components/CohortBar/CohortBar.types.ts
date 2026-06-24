import type { Cohort } from '@elective/shared';

export type CohortBarProps = {
  /** Cohorts newest-first (index 0 = newest/left, last = oldest/served-next). */
  cohorts: Cohort[];
  /** The list's fixed per-cohort capacity, shown as the denominator. */
  capacity: number;
};
