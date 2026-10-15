import { createApp } from './app';
import { env } from './config/env';
import { connectDb } from './db/mongoose';
import { startExpireRentalsJob } from './jobs/expireRentals';
import { rentalsService } from './modules/rentals/rentals.instance';

await connectDb(env.MONGODB_URI);
startExpireRentalsJob(rentalsService);
createApp(env.WEB_ORIGIN).listen(env.PORT, () => {
  console.log(`API listening on :${env.PORT}`);
});
