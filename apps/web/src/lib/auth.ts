import { cache } from 'react';
import { api } from './api';

// Server-side current user, read once per request via the single API client.
export const getCurrentUser = cache(() => api.getMe());
