import { api } from './client';

export interface RestaurantCreatePayload {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  coordinates: { latitude: number; longitude: number };
  opening_hours: { day: string; open_time: string; close_time: string; is_closed?: boolean }[];
  delivery_zones?: { name: string; coordinates: { latitude: number; longitude: number }; radius_km: number; delivery_fee: number }[];
}

export interface CreateRestaurantResponse {
  restaurant: { id: string; name: string; [key: string]: unknown };
  access_token?: string;
  refresh_token?: string;
}

export const restaurantsApi = {
  list: (params?: { latitude?: number; longitude?: number; limit?: number; offset?: number }) =>
    api.get('/restaurants', { params }),
  create: (data: RestaurantCreatePayload) =>
    api.post<CreateRestaurantResponse>('/restaurants/', data),
  get: (id: string) => api.get(`/restaurants/${id}`),
  getPaymentSettings: (restaurantId: string) =>
    api.get(`/restaurants/${restaurantId}/payment-settings`),
  updatePaymentSettings: (restaurantId: string, data: unknown) =>
    api.put(`/restaurants/${restaurantId}/payment-settings`, data),
  getStatistics: (
    restaurantId: string,
    params?: { period?: string; start_date?: string; end_date?: string }
  ) => api.get(`/restaurants/${restaurantId}/statistics`, { params }),
  getOrders: (
    restaurantId: string,
    params?: { status?: string; page?: number; page_size?: number }
  ) => api.get(`/restaurants/${restaurantId}/orders`, { params }),
  getPendingOrders: (restaurantId: string) =>
    api.get(`/restaurants/${restaurantId}/orders/pending`),
};
