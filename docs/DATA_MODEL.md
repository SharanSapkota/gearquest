# Data model (MongoDB / Mongoose)

## User
googleId (unique), email (unique), name, avatarUrl, bio, language ("fi"|"en"),
phone (E.164, private), ratingAvg, ratingCount, createdAt,
termsAcceptedAt, role (renter|owner|both, set in onboarding), whatsappShareConsent + consentAt
(owner's permission to reveal the phone after accepting; never makes it public), onboardingCompletedAt

## Gear
ownerId (ref User), title, description, category (enum: ski, snowboard, tent, kayak, bike, climbing, camping, other),
condition (new|good|fair), images[] (URLs), 
location { type: "Point", coordinates: [lng, lat] }, city,
pricing { hourlyCents?, dailyCents?, minHours? },
status (active|paused|deleted), createdAt
Indexes: 2dsphere on location; category; text on title+description; ownerId

## Rental
gearId, ownerId, renterId, mode (hourly|daily), startAt (UTC), endAt (UTC),
unitPriceCents (snapshot), totalCents, message,
status (requested|accepted|declined|cancelled|completed|expired),
decidedAt, completedAt, createdAt
Indexes: { gearId, status, startAt, endAt }; ownerId; renterId

## Review
rentalId, authorId, targetId, authorRole (owner|renter), rating (1-5), comment, createdAt
Unique index: { rentalId, authorId }
On create: update target user's ratingAvg and ratingCount.