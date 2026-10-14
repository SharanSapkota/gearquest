# GearShare: peer-to-peer adventure gear rental (Finland)

Stack: Next.js (frontend), Express (backend), MongoDB. TypeScript.
Languages: Finnish (default) and English. No hardcoded UI strings.

## Architecture rule (strict)
Backend: routes -> controller -> service -> repository.
- Controller: HTTP only.
- Service: all business logic, never touches the database directly.
- Repository: the only layer that talks to MongoDB.

## Hard rules
- Phone numbers are never returned by the API unless the rental is accepted and the caller is a party to it.
- Rental price is always computed server-side.
- No overlapping accepted rentals for the same gear.
- Reviews only after a rental is completed, one per party per rental.
- Money in integer cents (EUR), dates in UTC.
- Never commit secrets.

## Working style
- Do exactly what the task asks, nothing extra.
- Add tests for service logic. Run typecheck and tests before saying done.
- Product rules: docs/PRD.md (read only when relevant).

## Project structure and commands
pnpm workspaces monorepo (Node >=22). No Turborepo.
- apps/api: Express. src/modules/<name>/<name>.{routes,controller,service,repository,model,mapper}.ts
  (gear is the reference module; see apps/api/CLAUDE.md). Env validated in src/config/env.ts.
- apps/web: Next.js App Router, next-intl. Routes in src/app/[locale]/, messages in src/messages/{fi,en}.json,
  fetch only in src/lib/api.ts, locale proxy in src/proxy.ts (see apps/web/CLAUDE.md).
- packages/shared: Zod schemas, inferred types, enums/constants. Consumed as TS source (no build).
- Data model: docs/DATA_MODEL.md. Extra fields: Gear.publicLocation (offset, the only one exposed),
  Gear.acceptSeq (serializes accept overlap checks), Rental.expiresAt, User.deletedAt.

Commands (repo root):
- docker compose up -d   MongoDB replica set (transactions need it)
- cp .env.example .env   then fill in values
- pnpm dev               api :4000 + web :3000
- pnpm test | typecheck | lint | build   (run all four before saying done)
- pnpm --filter @gearshare/api test      single package
