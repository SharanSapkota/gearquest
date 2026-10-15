import {
  createGearSchema,
  type CATEGORIES,
  type CONDITIONS,
  type CreateGearInput,
} from '@gearshare/shared';

export type GearFormValues = {
  title: string;
  description: string;
  category: (typeof CATEGORIES)[number] | '';
  condition: (typeof CONDITIONS)[number] | '';
  city: string;
  location: { lng: number; lat: number } | null;
  hourly: boolean;
  daily: boolean;
  hourlyPrice: string; // EUR as typed by the user
  dailyPrice: string;
  minHours: string;
};

export type GearFormField =
  | 'title'
  | 'description'
  | 'category'
  | 'condition'
  | 'images'
  | 'city'
  | 'location'
  | 'pricing'
  | 'hourlyPrice'
  | 'dailyPrice'
  | 'minHours';

export type GearFormErrors = Partial<Record<GearFormField, string>>;

// "12", "12.5", "12,50" -> integer cents. Empty -> undefined. Anything else -> NaN (fails validation).
export function eurosToCents(input: string): number | undefined {
  const value = input.trim();
  if (value === '') return undefined;
  const match = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(value);
  if (!match) return NaN;
  return Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
}

export const centsToEuros = (cents: number) => (cents / 100).toFixed(2);

export function toGearInput(values: GearFormValues, images: string[]): unknown {
  const hourlyCents = values.hourly ? eurosToCents(values.hourlyPrice) : undefined;
  const dailyCents = values.daily ? eurosToCents(values.dailyPrice) : undefined;
  const minHours = values.hourly && values.minHours.trim() !== '' ? Number(values.minHours) : undefined;
  return {
    title: values.title,
    description: values.description,
    category: values.category,
    condition: values.condition,
    images,
    city: values.city,
    location: values.location ?? undefined,
    pricing: {
      ...(values.hourly && { hourlyCents: hourlyCents ?? NaN }),
      ...(values.daily && { dailyCents: dailyCents ?? NaN }),
      ...(minHours !== undefined && { minHours }),
    },
  };
}

// Maps a Zod issue path/message to the form field it belongs to. The matching message is
// looked up in the translations (gearForm.errors.<field>), so the schemas stay language-free.
function fieldFor(path: PropertyKey[], message: string): GearFormField {
  const [head, sub] = path;
  if (head === 'pricing') {
    if (sub === 'hourlyCents') return 'hourlyPrice';
    if (sub === 'dailyCents') return 'dailyPrice';
    if (sub === 'minHours' || message === 'pricing.minHoursNeedsHourly') return 'minHours';
    return 'pricing';
  }
  return head as GearFormField;
}

export type GearFormResult =
  | { ok: true; data: CreateGearInput }
  | { ok: false; errors: GearFormErrors };

export function validateGearForm(values: GearFormValues, images: string[]): GearFormResult {
  const parsed = createGearSchema.safeParse(toGearInput(values, images));
  if (parsed.success) return { ok: true, data: parsed.data };
  const errors: GearFormErrors = {};
  for (const issue of parsed.error.issues) {
    const field = fieldFor(issue.path, issue.message);
    errors[field] ??= field;
  }
  return { ok: false, errors };
}
