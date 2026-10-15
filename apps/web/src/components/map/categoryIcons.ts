import type { DivIconOptions } from 'leaflet';
import type { CATEGORIES } from '@gearshare/shared';

export type Category = (typeof CATEGORIES)[number];

// Single source of truth for marker icons and the legend. Every marker is the same teardrop
// pin; category is told apart by colour AND a white line glyph, so colour is never the only cue.
// Glyph paths are drawn in a 24x24 box with a round white stroke.
export const CATEGORY_STYLE: Record<Category, { color: string; glyph: string[] }> = {
  ski: { color: '#1d4ed8', glyph: ['M5 19L17 3', 'M9 21L21 5'] },
  snowboard: {
    color: '#7c3aed',
    glyph: ['M7 19L19 7a2 2 0 0 0-2.8-2.8L4.2 16.2A2 2 0 0 0 7 19z'],
  },
  tent: { color: '#b45309', glyph: ['M3 19L12 5l9 14z', 'M9 19l3-6 3 6'] },
  kayak: { color: '#0e7490', glyph: ['M2 14c6-5 14-5 20 0-6 5-14 5-20 0z', 'M6 5l12 5'] },
  bike: {
    color: '#be123c',
    glyph: [
      'M2 17a4 4 0 1 0 8 0 4 4 0 1 0-8 0',
      'M14 17a4 4 0 1 0 8 0 4 4 0 1 0-8 0',
      'M6 17l4-8h6l2 8M10 9l3 8 3-8',
    ],
  },
  climbing: { color: '#4d7c0f', glyph: ['M2 20L9 7l4 7 3-4 6 10z'] },
  camping: {
    color: '#c2410c',
    glyph: ['M12 3c2 5 6 7 6 12a6 6 0 0 1-12 0c0-3 3-4 3-8 1 1 2-1 3-4z'],
  },
  other: { color: '#475569', glyph: ['M5 12h.01', 'M12 12h.01', 'M19 12h.01'] },
};

const PIN_PATH =
  'M16 1C7.7 1 1 7.6 1 15.8c0 10.6 13.4 22 14.2 22.7a1.2 1.2 0 0 0 1.6 0C17.6 37.8 31 26.4 31 15.8 31 7.6 24.3 1 16 1z';

// SVG markup of a full pin (used by the map markers and the legend).
export function categoryPinSvg(category: Category, size = 32): string {
  const { color, glyph } = CATEGORY_STYLE[category];
  const paths = glyph.map((d) => `<path d="${d}"/>`).join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${(size * 40) / 32}" ` +
    `viewBox="0 0 32 40" aria-hidden="true" focusable="false">` +
    `<path d="${PIN_PATH}" fill="${color}" stroke="#fff" stroke-width="2"/>` +
    `<g transform="translate(4 4)" fill="none" stroke="#fff" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`
  );
}

// Leaflet divIcon options as plain data, so this file never imports Leaflet at runtime (Leaflet
// touches `window` and must not be evaluated during server rendering; the legend imports this
// file too). The map turns these into icons with `divIcon(...)`.
export const categoryIconOptions = (category: Category): DivIconOptions => ({
  html: categoryPinSvg(category),
  className: 'gear-marker',
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -36],
});

// Cluster bubble; the size grows with the number of gear items it holds.
export function clusterIconOptions(count: number): DivIconOptions {
  const size = count < 10 ? 38 : count < 50 ? 46 : 54;
  return {
    html: `<span class="gear-cluster">${count}</span>`,
    className: 'gear-cluster-wrap',
    iconSize: [size, size],
  };
}
