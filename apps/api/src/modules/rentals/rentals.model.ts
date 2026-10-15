import { Schema, model } from 'mongoose';
import { RENTAL_MODES, RENTAL_STATUSES } from '@gearshare/shared';

const rentalSchema = new Schema(
  {
    gearId: { type: Schema.Types.ObjectId, ref: 'Gear', required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    renterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // Snapshot so history survives gear edits or deletion.
    gearSnapshot: {
      title: { type: String, required: true },
      coverImage: String,
    },
    mode: { type: String, enum: RENTAL_MODES, required: true },
    startAt: { type: Date, required: true }, // UTC
    endAt: { type: Date, required: true }, // UTC
    unitPriceCents: { type: Number, required: true }, // snapshot of the gear price
    quantity: { type: Number, required: true }, // billed hours or days
    totalCents: { type: Number, required: true }, // unitPriceCents * quantity, server-side
    message: String,
    status: { type: String, enum: RENTAL_STATUSES, default: 'requested' },
    expiresAt: { type: Date, required: true },
    decidedAt: Date,
    completedAt: Date, // reviews unlock when status === 'completed'
    cancelledAt: Date,
    cancelledBy: { type: String, enum: ['owner', 'renter'] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Overlap check and availability only ever look at accepted rentals.
rentalSchema.index(
  { gearId: 1, startAt: 1, endAt: 1 },
  { partialFilterExpression: { status: 'accepted' } },
);
rentalSchema.index({ ownerId: 1, status: 1, createdAt: -1 });
rentalSchema.index({ renterId: 1, status: 1, createdAt: -1 });
rentalSchema.index({ status: 1, expiresAt: 1 });

export const RentalModel = model('Rental', rentalSchema);
