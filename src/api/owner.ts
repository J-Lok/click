import { api } from './client';

export const ownerApi = {
  getMyRestaurants: (params?: { limit?: number; offset?: number }) =>
    api.get('/owner/restaurants', { params }),
};