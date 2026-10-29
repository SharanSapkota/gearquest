// One-off migration: sets Gear.cityKey on listings created before the field existed.
// Idempotent. Logs counts only. Run: pnpm --filter @gearquest/api backfill:city-key
import mongoose from 'mongoose';
import { cityKey } from '@gearquest/shared';
import { GearModel } from '../src/modules/gear/gear.model';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set.');
  await mongoose.connect(uri);
  const missing = await GearModel.find({ cityKey: { $exists: false } }).select('city').lean();
  if (missing.length > 0) {
    await GearModel.bulkWrite(
      missing.map((g) => ({ updateOne: { filter: { _id: g._id }, update: { $set: { cityKey: cityKey(g.city) } } } })),
    );
  }
  console.log(`cityKey backfilled on ${missing.length} listings.`);
  await mongoose.disconnect();
}

main().catch(async (err: unknown) => {
  console.error(err instanceof Error ? err.message : 'backfill failed');
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
