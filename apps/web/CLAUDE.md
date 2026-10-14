# Web rules
- Routes live under src/app/[locale]/. Locales: fi (default), en.
- Server Components by default. "use client" only for maps, forms, date pickers.
- Data fetching through src/lib/api.ts only. No fetch calls scattered in components.
- Map: Leaflet (client-only, dynamic import with ssr:false). One icon per gear category, defined in src/components/map/categoryIcons.ts.
- Filters live in URL search params so pages are shareable and SSR-friendly. Same filter component is reused on home and map pages.
- Format money and dates with Intl using the active locale and Europe/Helsinki.
- Every page needs the intermediary disclaimer in the footer (key: legal.disclaimer).