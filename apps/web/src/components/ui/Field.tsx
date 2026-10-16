import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

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
export const Select = (props: SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} />;
export const Textarea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} />
);
