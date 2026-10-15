import cron from 'node-cron';

// Persists the "expired" status for stale requests. Reads already treat them as expired, so
// correctness does not depend on this job running.
export function startExpireRentalsJob(
  service: { expireStale: () => Promise<number> },
  schedule = '*/10 * * * *',
) {
  return cron.schedule(schedule, () => {
    service.expireStale().catch((err) => console.error('expireRentals failed', err));
  });
}
