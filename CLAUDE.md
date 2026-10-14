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
(To be filled in after Prompt 0.)