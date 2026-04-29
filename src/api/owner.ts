import { api } from './client';

export const ownerApi = {
  getMyRestaurants: (params?: { skip?: number; limit?: number }) =>
    api.get('/restaurants/owner/restaurants', { params }),
  getDashboard: () =>
    api.get('/owner/dashboard'),
  getQuickStats: (restaurantId?: string) =>
    api.get('/owner/dashboard/quick-stats', { params: restaurantId ? { restaurant_id: restaurantId } : undefined }),
};
