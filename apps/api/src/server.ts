import { createApp } from './app';
import { env } from './config/env';
import { connectDb } from './db/mongoose';

await connectDb(env.MONGODB_URI);
createApp(env.WEB_ORIGIN).listen(env.PORT, () => {
  console.log(`API listening on :${env.PORT}`);
});
