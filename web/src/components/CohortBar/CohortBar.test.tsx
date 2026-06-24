import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CohortBar } from './CohortBar';
import type { Cohort } from '@elective/shared';

const cohort = (count: number, seq: number): Cohort => ({
  id: `c${seq}`,
  seq,
  count,
  createdAt: '',
  updatedAt: ''
});

describe('CohortBar', () => {
  it('renders counts as boxes in order (newest-first)', () => {
    render(
      <CohortBar
        capacity={10}
        cohorts={[cohort(8, 4), cohort(10, 3), cohort(10, 2), cohort(10, 1)]}
      />
    );
    const counts = screen.getAllByTestId('cohort').map(box => box.firstChild?.textContent);
    expect(counts).toEqual(['8', '10', '10', '10']);
  });

  it('flags the oldest (served-next) cohort only', () => {
    render(
      <CohortBar
        capacity={10}
        cohorts={[cohort(8, 2), cohort(10, 1)]}
      />
    );
    const boxes = screen.getAllByTestId('cohort');
    expect(boxes[boxes.length - 1]).toHaveTextContent('next');
    expect(boxes[0]).not.toHaveTextContent('next');
  });

  it('shows a placeholder when there are no cohorts', () => {
    render(
      <CohortBar
        capacity={10}
        cohorts={[]}
      />
    );
    expect(screen.getByTestId('cohorts-empty')).toBeInTheDocument();
  });
});
