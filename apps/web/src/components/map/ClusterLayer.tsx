'use client';

import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import type { PublicGear } from '@/lib/api';
import { categoryPinElement, clusterElement } from './categoryIcons';

type Marker = google.maps.marker.AdvancedMarkerElement;
export type MapFocus = { id: string; n: number };

const FOCUS_ZOOM = 14;

function highlight(marker: Marker, selected: boolean) {
  (marker.content as HTMLElement | null)?.classList.toggle('is-selected', selected);
  marker.zIndex = selected ? 2000 : null;
}

// Category pins grouped into clusters (clicking a cluster zooms to where it splits). Positions
// are the API's approximate public location, nothing else. Markers are keyed by gear id and
// reused between fetches so panning does not rebuild the whole layer.
export function ClusterLayer({
  items,
  selectedId,
  focus,
  onSelect,
}: {
  items: PublicGear[];
  selectedId: string | null;
  focus: MapFocus | null;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations('map');
  const map = useMap();
  const markerLib = useMapsLibrary('marker');
  const clusterer = useRef<MarkerClusterer | null>(null);
  const markers = useRef(new globalThis.Map<string, Marker>());
  const onSelectRef = useRef(onSelect);
  const handledFocus = useRef(0);

  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  // Tear down with the map.
  useEffect(
    () => () => {
      clusterer.current?.clearMarkers();
      clusterer.current?.onRemove();
      clusterer.current = null;
      markers.current.clear();
    },
    [],
  );

  useEffect(() => {
    if (!map || !markerLib) return;
    const { AdvancedMarkerElement } = markerLib;
    clusterer.current ??= new MarkerClusterer({
      map,
      renderer: {
        render: ({ count, position }) =>
          new AdvancedMarkerElement({
            position,
            content: clusterElement(count),
            title: t('cluster', { count }),
            zIndex: 1000 + count,
            gmpClickable: true,
          }),
      },
    });

    const wanted = new Set<string>();
    const added: Marker[] = [];
    for (const gear of items) {
      if (!gear.location) continue;
      wanted.add(gear.id);
      if (markers.current.has(gear.id)) continue;
      const marker = new AdvancedMarkerElement({
        position: { lng: gear.location[0], lat: gear.location[1] },
        content: categoryPinElement(gear.category),
        title: gear.title,
        gmpClickable: true,
      });
      marker.addEventListener('gmp-click', () => onSelectRef.current(gear.id));
      markers.current.set(gear.id, marker);
      added.push(marker);
    }
    const stale: Marker[] = [];
    for (const [id, marker] of markers.current) {
      if (wanted.has(id)) continue;
      stale.push(marker);
      markers.current.delete(id);
    }
    clusterer.current.removeMarkers(stale, true);
    clusterer.current.addMarkers(added, true);
    clusterer.current.render();
  }, [items, map, markerLib, t]);

  // Highlight the selected pin.
  useEffect(() => {
    for (const [id, marker] of markers.current) {
      highlight(marker, id === selectedId);
    }
  }, [selectedId, items, map]);

  // A list tap pans to the marker and zooms in far enough for it to leave its cluster.
  useEffect(() => {
    if (!map || !focus || focus.n === handledFocus.current) return;
    const position = markers.current.get(focus.id)?.position;
    if (!position) return;
    handledFocus.current = focus.n;
    map.panTo(position);
    if ((map.getZoom() ?? 0) < FOCUS_ZOOM) map.setZoom(FOCUS_ZOOM);
  }, [focus, map, items]);

  return null;
}
