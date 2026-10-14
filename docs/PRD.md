# GearShare PRD (v1)

## Goal
Peer-to-peer rental of adventure gear in Finland (skis, snowboards, tents, kayaks, bikes, etc.). We only connect people. We do not handle payments, insurance, or disputes.

## Roles
- Guest: browse gear list, map, gear details, public profiles
- User: signed in with Google. Can list gear, request rentals, rate.
- Every user can be both owner and renter.

## Pages
1. Home: gear list immediately on load, with filters
2. Map tab: gear as markers with per-category icons, same filters
3. Gear detail: photos, description, pricing, owner profile + rating, availability calendar, rental request form
4. Add gear (auth)
5. My profile / public profile: name, avatar, bio, rating, listed gear, reviews
6. My rentals: incoming requests (as owner), outgoing requests (as renter)

## Filters (home + map)
Category, price range, rental mode (hourly / daily), available from-to dates, distance from a point, condition, text search, minimum owner rating. Optional category-specific attributes later (e.g. ski length).

## Gear
Owner sets: title, description, category, condition, photos, location, and pricing:
- hourlyPriceCents and/or dailyPriceCents (at least one required)
- minimum rental hours (hourly mode only)
Public map shows an approximate location (offset ~300 m). Exact address is shared in chat after acceptance.

## Rental flow
requested -> accepted | declined | cancelled
accepted -> completed | cancelled
- Renter picks start and end. Daily = dates, hourly = date+time.
- Request goes to owner. Owner accepts or declines.
- Only ACCEPTED rentals block availability. Pending requests do not.
- On acceptance, both parties see each other's phone number and a WhatsApp link (https://wa.me/<number>). Before that, never exposed.
- Either party can mark completed after end time. Then reviews unlock.
- Requests not answered within 48 h expire (status: expired).

## Ratings
After completed: owner rates renter, renter rates owner. 1-5 stars + optional comment. One per party per rental. Visible on profiles.

## Legal
Footer + rental request screen + signup must show: "GearShare is only a platform that connects gear owners and renters. We are not a party to any rental agreement and accept no responsibility for damage, loss, injury, or disputes. All such matters are solely between the renter and the owner."
(Have a Finnish lawyer review. Provide fi and en text.)
Also needed: privacy policy, cookie consent, account deletion (GDPR).

## Out of scope for v1
Payments, deposits, insurance, in-app chat, push notifications, mobile app.

## Assumption to confirm
Phone numbers are revealed to BOTH parties after owner acceptance.