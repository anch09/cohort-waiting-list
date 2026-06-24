import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NumberField } from './NumberField';

function setup(onSubmit = vi.fn()) {
  render(
    <NumberField
      label='Add'
      submitLabel='Add'
      onSubmit={onSubmit}
    />
  );
  return {
    onSubmit,
    input: screen.getByLabelText('Add'),
    button: screen.getByRole('button', { name: 'Add' })
  };
}

describe('NumberField', () => {
  it('rejects a non-integer and keeps submit disabled', async () => {
    const { input, button } = setup();
    await userEvent.type(input, '1.5');
    expect(screen.getByRole('alert')).toHaveTextContent('Whole numbers only');
    expect(button).toBeDisabled();
  });

  it('shows "Minimum is 1" for 0 and keeps submit disabled', async () => {
    const { input, button } = setup();
    await userEvent.type(input, '0');
    expect(screen.getByRole('alert')).toHaveTextContent('Minimum is 1');
    expect(button).toBeDisabled();
  });

  it('submits a valid integer and clears the field', async () => {
    const { input, button, onSubmit } = setup();
    await userEvent.type(input, '5');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(onSubmit).toHaveBeenCalledWith(5);
    expect(input).toHaveValue('');
  });

  it('is fully disabled via the disabled prop', () => {
    render(
      <NumberField
        label='Add'
        submitLabel='Add'
        onSubmit={vi.fn()}
        disabled
      />
    );
    expect(screen.getByLabelText('Add')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  });

  it('shows an informational note when there is no validation error', () => {
    render(
      <NumberField
        label='Take'
        submitLabel='Take'
        onSubmit={vi.fn()}
        note='Up to 18 available.'
      />
    );
    expect(screen.getByText('Up to 18 available.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('prefers the validation error over the note', async () => {
    render(
      <NumberField
        label='Take'
        submitLabel='Take'
        onSubmit={vi.fn()}
        note='Up to 18 available.'
      />
    );
    await userEvent.type(screen.getByLabelText('Take'), '0');
    expect(screen.getByRole('alert')).toHaveTextContent('Minimum is 1');
    expect(screen.queryByText('Up to 18 available.')).toBeNull();
  });
});
