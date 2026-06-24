import { useId, useState, type FormEvent } from 'react';
import type { NumberFieldProps } from './NumberField.types';

/**
 * A small integer input + submit. Validates from the typed value and surfaces the error
 * inline; submit stays disabled until the value is a whole number >= `min`.
 */
export function NumberField({
  label,
  submitLabel,
  onSubmit,
  min = 1,
  disabled = false,
  note
}: NumberFieldProps) {
  const inputId = useId();
  const [value, setValue] = useState('');

  const trimmed = value.trim();
  const isInteger = /^-?\d+$/.test(trimmed);
  const n = isInteger ? Number.parseInt(trimmed, 10) : Number.NaN;

  let error = '';
  if (trimmed !== '') {
    if (!isInteger) error = 'Whole numbers only';
    else if (n < min) error = `Minimum is ${min}`;
  }
  const valid = isInteger && n >= min;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!valid || disabled) return;
    onSubmit(n);
    setValue('');
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='flex flex-col gap-1'
    >
      {/* Label + input + button share one aligned row; the message hangs below it so the
          row stays at the same height whether or not a note/error is present. */}
      <div className='flex items-end gap-2'>
        <div className='flex flex-col'>
          <label
            htmlFor={inputId}
            className='text-sm font-medium text-slate-700'
          >
            {label}
          </label>
          <input
            id={inputId}
            inputMode='numeric'
            value={value}
            onChange={event => setValue(event.target.value)}
            aria-invalid={error !== ''}
            disabled={disabled}
            className='mt-1 w-24 rounded border border-slate-300 px-2 py-1'
          />
        </div>
        <button
          type='submit'
          disabled={!valid || disabled}
          className='rounded bg-slate-900 px-3 py-1.5 text-white disabled:opacity-40'
        >
          {submitLabel}
        </button>
      </div>
      {error !== '' ? (
        <span
          role='alert'
          className='text-sm text-red-600'
        >
          {error}
        </span>
      ) : note ? (
        <span className='text-sm text-slate-500'>{note}</span>
      ) : null}
    </form>
  );
}
