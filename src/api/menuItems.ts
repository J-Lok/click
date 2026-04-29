import { api } from './client';

export const menuItemsApi = {
  listByRestaurant: (
    restaurantId: string,
    params?: { category?: string; available_only?: boolean }
  ) => api.get(`/menu-items/restaurant/${restaurantId}/menu`, { params }),
  get: (itemId: string) => api.get(`/menu-items/menu/${itemId}`),
};
