import type { GearFilters } from '@gearshare/shared';
import { notFound } from '../../lib/errors';
import { toPublicGear } from './gear.mapper';
import type { GearRepository } from './gear.repository';

export function createGearService(repo: Pick<GearRepository, 'findActive' | 'findById'>) {
  return {
    async list(filters: GearFilters) {
      const items = await repo.findActive(filters);
      return items.map(toPublicGear);
    },
    async get(id: string) {
      const gear = await repo.findById(id);
      if (!gear) throw notFound('gear.notFound');
      return toPublicGear(gear);
    },
  };
}
