import { Schema, model } from 'mongoose';
import { RENTAL_MODES, RENTAL_STATUSES } from '@gearshare/shared';

const rentalSchema = new Schema(
  {
    gearId: { type: Schema.Types.ObjectId, ref: 'Gear', required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    renterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mode: { type: String, enum: RENTAL_MODES, required: true },
    startAt: { type: Date, required: true }, // UTC
    endAt: { type: Date, required: true }, // UTC
    unitPriceCents: { type: Number, required: true }, // snapshot
    totalCents: { type: Number, required: true }, // computed server-side
    message: String,
    status: { type: String, enum: RENTAL_STATUSES, default: 'requested' },
    expiresAt: { type: Date, required: true },
    decidedAt: Date,
    completedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

rentalSchema.index({ gearId: 1, status: 1, startAt: 1, endAt: 1 });
rentalSchema.index({ ownerId: 1, createdAt: -1 });
rentalSchema.index({ renterId: 1, createdAt: -1 });
rentalSchema.index({ status: 1, expiresAt: 1 });

export const RentalModel = model('Rental', rentalSchema);
