'use client';

import type { ReactNode } from 'react';

// Single-choice radio group drawn as pills. Uncontrolled: the form reads the value on submit.
export function PillGroup({
  name,
  defaultValue,
  options,
}: {
  name: string;
  defaultValue: string;
  options: { value: string; label: ReactNode }[];
}) {
  return (
    <div className="pillgroup" role="radiogroup">
      {options.map((o) => (
        <label key={o.value} className="pillgroup__item">
          <input type="radio" name={name} value={o.value} defaultChecked={o.value === defaultValue} />
          {o.label}
        </label>
      ))}
    </div>
  );
}
