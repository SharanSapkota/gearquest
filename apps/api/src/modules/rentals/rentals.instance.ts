import { gearRepository } from '../gear/gear.repository';
import { usersRepository } from '../users/users.repository';
import { rentalsRepository } from './rentals.repository';
import { createRentalsService } from './rentals.service';

export const rentalsService = createRentalsService({
  rentals: rentalsRepository,
  gear: gearRepository,
  users: usersRepository,
});
