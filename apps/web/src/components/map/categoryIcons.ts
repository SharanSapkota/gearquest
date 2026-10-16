import type { CATEGORIES } from '@gearshare/shared';

export type Category = (typeof CATEGORIES)[number];

// Single source of truth for category glyphs: the filter chips, cards and map markers all draw
// these same Lucide line glyphs (24x24 box, round stroke, `currentColor` / white on pins).
// Markup is static and trusted; it is only ever injected through CategoryIcon or the pin SVG.
export const CATEGORY_GLYPH: Record<Category, string> = {
  ski: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/><path d="M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.19"/>',
  snowboard:
    '<path d="m10 20-1.25-2.5L6 18"/><path d="M10 4 8.75 6.5 6 6"/><path d="m14 20 1.25-2.5L18 18"/><path d="m14 4 1.25 2.5L18 6"/><path d="m17 21-3-6h-4"/><path d="m17 3-3 6 1.5 3"/><path d="M2 12h6.5L10 9"/><path d="m20 10-1.5 2 1.5 2"/><path d="M22 12h-6.5L14 15"/><path d="m4 10 1.5 2L4 14"/><path d="m7 21 3-6-1.5-3"/><path d="m7 3 3 6h4"/>',
  tent: '<path d="M3.5 21 14 3"/><path d="M20.5 21 10 3"/><path d="M15.5 21 12 15l-3.5 6"/><path d="M2 21h20"/>',
  kayak:
    '<path d="M2 12q2.5 2 5 0t5 0 5 0 5 0"/><path d="M2 19q2.5 2 5 0t5 0 5 0 5 0"/><path d="M2 5q2.5 2 5 0t5 0 5 0 5 0"/>',
  bike: '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
  climbing: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
  camping:
    '<path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"/>',
  other:
    '<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 10h8"/><path d="M8 18h8"/><path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
};

// Pin fill per category (SVG marker colours are the one place raw hex is allowed). Muted Nordic
// tones; the glyph, not the colour, tells categories apart.
export const CATEGORY_STYLE: Record<Category, { color: string }> = {
  ski: { color: '#2f5d7c' },
  snowboard: { color: '#5b4b8a' },
  tent: { color: '#9a5a1a' },
  kayak: { color: '#1f7a80' },
  bike: { color: '#a6384f' },
  climbing: { color: '#4a6a2f' },
  camping: { color: '#b4470f' },
  other: { color: '#4b5563' },
};

const PIN_PATH =
  'M16 1C7.7 1 1 7.6 1 15.8c0 10.6 13.4 22 14.2 22.7a1.2 1.2 0 0 0 1.6 0C17.6 37.8 31 26.4 31 15.8 31 7.6 24.3 1 16 1z';

// SVG markup of a full pin (used by the map markers and the legend).
export function categoryPinSvg(category: Category, size = 32): string {
  const { color } = CATEGORY_STYLE[category];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${(size * 40) / 32}" ` +
    `viewBox="0 0 32 40" aria-hidden="true" focusable="false">` +
    `<path d="${PIN_PATH}" fill="${color}" stroke="#fff" stroke-width="2"/>` +
    `<g transform="translate(6.5 6.5) scale(0.8)" fill="none" stroke="#fff" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round">${CATEGORY_GLYPH[category]}</g></svg>`
  );
}

// DOM content for an AdvancedMarkerElement (client only). `selected` is toggled with a class.
export function categoryPinElement(category: Category): HTMLElement {
  const el = document.createElement('div');
  el.className = 'gear-pin';
  el.innerHTML = categoryPinSvg(category);
  return el;
}

// Cluster bubble; the size grows with the number of gear items it holds.
export function clusterElement(count: number): HTMLElement {
  const size = count < 10 ? 40 : count < 50 ? 48 : 56;
  const el = document.createElement('div');
  el.className = 'gear-cluster';
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.textContent = String(count);
  return el;
}
