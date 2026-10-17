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
- Art direction: Nordic outdoor, warm and confident. Cream paper (--bg), charcoal ink, deep forest (--forest) for footer/hero band, orange only for primary action, active state and price. Fonts: Fraunces (display) + Figtree (body) via next/font; prices use tabular numbers.
- Tokens (colours, radii, shadows, type and spacing scale, safe-area vars) only in src/styles/tokens.css. Primary = orange (white text needs 600+, orange text on cream needs 700), secondary = forest green. No raw hex elsewhere except SVG marker colours and Google Maps circle options.
- Layout is fluid: no max-width wrapper. Pages use padding-inline var(--gutter); only forms (.page--form) and prose (.page--narrow) get a readable width. Gear grid is auto-fill minmax(260px, 1fr).
- Icons: one set (lucide-react) re-exported from src/components/ui/icons.tsx. Category glyphs live in src/components/map/categoryIcons.ts and are shared by chips, cards and map markers (CategoryIcon). No emojis. The contour motif is public/contour.svg, applied with the .contour class.
- Shared primitives in src/components/ui (Button, IconButton, Field/Input/Select/Textarea/Switch, Badge, Card, Chip, Sheet, Popover, Toast, Skeleton/GearCardSkeleton, EmptyState, GearImage, CategoryIcon). Reuse them, do not restyle ad hoc. Filters: SegmentedSearch (What/Where/When), CategoryChips, FilterControls (popover on desktop, sheet on phones).
- Mobile first: 44px touch targets, bottom tab bar under 768px, safe-area insets, 16px input text, sticky booking bar on the gear page. Respect prefers-reduced-motion.
