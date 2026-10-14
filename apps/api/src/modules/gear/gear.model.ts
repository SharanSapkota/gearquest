import { Schema, model } from 'mongoose';
import { CATEGORIES, CONDITIONS, GEAR_STATUSES } from '@gearshare/shared';

const pointField = {
  type: { type: String, enum: ['Point'], required: true },
  coordinates: { type: [Number], required: true }, // [lng, lat]
};

const gearSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, enum: CATEGORIES, required: true },
    condition: { type: String, enum: CONDITIONS, required: true },
    images: [String],
    city: { type: String, required: true },
    address: String, // private
    location: pointField, // exact, private
    publicLocation: { ...pointField }, // offset ~300 m, the only one exposed
    pricing: {
      hourlyCents: Number,
      dailyCents: Number,
      minHours: Number,
    },
    ownerRatingAvg: { type: Number, default: 0 }, // denormalized for the rating filter
    acceptSeq: { type: Number, default: 0 }, // bumped on accept to serialize overlap checks
    status: { type: String, enum: GEAR_STATUSES, default: 'active' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

gearSchema.index({ publicLocation: '2dsphere' });
gearSchema.index({ status: 1, category: 1, 'pricing.dailyCents': 1 });
gearSchema.index({ status: 1, category: 1, 'pricing.hourlyCents': 1 });
gearSchema.index({ title: 'text', description: 'text' });

export const GearModel = model('Gear', gearSchema);
