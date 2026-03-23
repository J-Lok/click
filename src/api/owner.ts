import { api } from './client';

export const ownerApi = {
  getMyRestaurants: (params?: { skip?: number; limit?: number }) =>
    api.get('/restaurants/owner/restaurants', { params }),
};
