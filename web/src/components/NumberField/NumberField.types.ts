export type NumberFieldProps = {
  /** Visible label and accessible name for the input. */
  label: string;
  /** Submit button text. */
  submitLabel: string;
  /** Called with the validated integer when submitted. */
  onSubmit: (n: number) => void;
  /** Smallest accepted value. Default 1 (mirrors the domain's reject-zero rule). */
  min?: number;
  /** Disables the whole control (e.g. while a request is in flight). */
  disabled?: boolean;
};
