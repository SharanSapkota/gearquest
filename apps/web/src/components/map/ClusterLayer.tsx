'use client';

import { divIcon, type DivIcon, type Map as LeafletMap } from 'leaflet';
import { useMemo, useState } from 'react';
import { Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import Supercluster from 'supercluster';
import { useTranslations } from 'next-intl';
import type { PublicGear } from '@/lib/api';
import { MAX_ZOOM } from '@/lib/mapView';
import { categoryIconOptions, clusterIconOptions, type Category } from './categoryIcons';
import { GearPopup } from './GearPopup';

type Bounds = [west: number, south: number, east: number, north: number];

const categoryIcons = new Map<Category, DivIcon>();
const categoryIcon = (category: Category) => {
  let icon = categoryIcons.get(category);
  if (!icon) {
    icon = divIcon(categoryIconOptions(category));
    categoryIcons.set(category, icon);
  }
  return icon;
};

// Stable icon instances: a new icon object on every render would make react-leaflet reset it.
const clusterIcons = new Map<number, DivIcon>();
const clusterIcon = (count: number) => {
  let icon = clusterIcons.get(count);
  if (!icon) {
    icon = divIcon(clusterIconOptions(count));
    clusterIcons.set(count, icon);
  }
  return icon;
};

const snapshot = (map: LeafletMap) => {
  const b = map.getBounds();
  return {
    bounds: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()] as Bounds,
    zoom: Math.round(map.getZoom()),
  };
};

// Groups nearby gear into clusters for the current view. Clicking a cluster zooms to the level
// where it splits. Positions are the API's approximate public location, nothing else.
export function ClusterLayer({ items }: { items: PublicGear[] }) {
  const t = useTranslations();
  const map = useMap();
  const [view, setView] = useState(() => snapshot(map));
  useMapEvents({ moveend: () => setView(snapshot(map)) });

  const index = useMemo(() => {
    const sc = new Supercluster<{ gear: PublicGear }>({ radius: 60, maxZoom: MAX_ZOOM - 1 });
    sc.load(
      items.flatMap((gear) =>
        gear.location
          ? [
              {
                type: 'Feature' as const,
                properties: { gear },
                geometry: { type: 'Point' as const, coordinates: gear.location },
              },
            ]
          : [],
      ),
    );
    return sc;
  }, [items]);

  const [west, south, east, north] = view.bounds;
  const clamp = (n: number, limit: number) => Math.min(limit, Math.max(-limit, n));
  const features = index.getClusters(
    [clamp(west, 180), clamp(south, 90), clamp(east, 180), clamp(north, 90)],
    view.zoom,
  );

  return (
    <>
      {features.map((feature) => {
        const [lng, lat] = feature.geometry.coordinates as [number, number];
        const props = feature.properties;
        if ('cluster' in props && props.cluster) {
          const count = props.point_count;
          return (
            <Marker
              key={`c-${props.cluster_id}-${count}`}
              position={[lat, lng]}
              icon={clusterIcon(count)}
              title={t('map.cluster', { count })}
              alt={t('map.cluster', { count })}
              eventHandlers={{
                click: () =>
                  map.flyTo([lat, lng], Math.min(index.getClusterExpansionZoom(props.cluster_id), MAX_ZOOM)),
              }}
            />
          );
        }
        const gear = (props as { gear: PublicGear }).gear;
        return (
          <Marker
            key={`g-${gear.id}`}
            position={[lat, lng]}
            icon={categoryIcon(gear.category)}
            title={gear.title}
            alt={gear.title}
            eventHandlers={{
              popupopen: (e) => {
                // Leaflet's built-in close button label is English-only; localise it.
                e.popup
                  .getElement()
                  ?.querySelector('.leaflet-popup-close-button')
                  ?.setAttribute('aria-label', t('map.closePopup'));
              },
            }}
          >
            <Popup minWidth={220} maxWidth={260}>
              <GearPopup gear={gear} />
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
