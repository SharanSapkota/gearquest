import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { ChevronDownIcon } from './icons';

// Label + control + hint/error, the one layout every form uses.
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      {label}
      {children}
      {hint && <small>{hint}</small>}
      {error && <span role="alert">{error}</span>}
    </label>
  );
}

// Inputs are styled globally (44px, 16px text); these exist so call sites read as one system.
export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => <input {...props} />;
// The wrapper draws the chevron (native arrows are hidden by base.css).
export const Select = ({ children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <span className="select">
    <select {...rest}>{children}</select>
    <ChevronDownIcon size={18} />
  </span>
);
export const Textarea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} />
);

// Checkbox rendered as a switch.
export function Switch({
  label,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'> & { label: string }) {
  return (
    <label className="check">
      <input type="checkbox" role="switch" {...rest} />
      {label}
    </label>
  );
}
