# Web rules
- Routes live under src/app/[locale]/. Locales: fi (default), en.
- Server Components by default. "use client" only for maps, forms, date pickers.
- Data fetching through src/lib/api.ts only. No fetch calls scattered in components.
- Map: Google Maps via @vis.gl/react-google-maps + @googlemaps/markerclusterer (client-only, dynamic import with ssr:false). All loading and the API key live in src/components/map/GoogleMapShell.tsx; every map renders through it. One icon per gear category, defined in src/components/map/categoryIcons.ts.
- Map env: NEXT_PUBLIC_GOOGLE_MAP_API_KEY (required), NEXT_PUBLIC_GOOGLE_MAP_ID (optional, falls back to DEMO_MAP_ID). The muted theme style is map-style.json: import it into a Cloud Console map style and use that map ID (Google ignores in-code styles when a mapId is set).
- Filters live in URL search params so pages are shareable and SSR-friendly. Same filter component is reused on home and map pages.
- Format money and dates with Intl using the active locale and Europe/Helsinki.
- Every page needs the intermediary disclaimer in the footer (key: legal.disclaimer).
## Design system
- Tokens (colours, radii, shadows, safe-area vars) only in src/styles/tokens.css. Primary = orange (white text needs 600+), secondary = green. No raw hex elsewhere except SVG marker colours and Google Maps circle options.
- Shared primitives in src/components/ui (Button, IconButton, Field/Input/Select/Textarea, Badge, Card, Chip, Sheet, Toast, Skeleton, EmptyState, GearImage). Reuse them, do not restyle ad hoc.
- Mobile first: 44px touch targets, bottom tab bar under 768px, safe-area insets, 16px input text.
