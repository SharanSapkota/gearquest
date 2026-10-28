import { Schema, model } from 'mongoose';
import { REVIEW_ROLES } from '@gearquest/shared';

const reviewSchema = new Schema(
  {
    rentalId: { type: Schema.Types.ObjectId, ref: 'Rental', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorRole: { type: String, enum: REVIEW_ROLES, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

reviewSchema.index({ rentalId: 1, authorId: 1 }, { unique: true });
reviewSchema.index({ targetId: 1, createdAt: -1 });

export const ReviewModel = model('Review', reviewSchema);
