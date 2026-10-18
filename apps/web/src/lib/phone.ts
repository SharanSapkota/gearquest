export const PHONE_PREFIX = '+358 ';

// A bare country code means "no number".
export const cleanPhone = (value: string) => (/^\s*(\+358)?\s*$/.test(value) ? '' : value.trim());
