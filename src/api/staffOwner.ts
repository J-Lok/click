import { api } from './client';

export interface RestaurantStaffCreateOwner {
  username: string;
  role: string;
}

export interface RestaurantStaffUpdateOwner {
  role?: string;
  is_active?: boolean;
}

export interface RestaurantStaffResponse {
  id: string;
  restaurant_id: string;
  user_id: string;
  username: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const staffOwnerApi = {
  list: (restaurantId: string) =>
    api.get<RestaurantStaffResponse[]>(`/staff/owner/restaurants/${restaurantId}/staff`),

  create: (restaurantId: string, data: RestaurantStaffCreateOwner) =>
    api.post<RestaurantStaffResponse>(
      `/staff/owner/restaurants/${restaurantId}/staff`,
      data
    ),

  update: (restaurantId: string, staffId: string, data: RestaurantStaffUpdateOwner) =>
    api.put<RestaurantStaffResponse>(
      `/staff/owner/restaurants/${restaurantId}/staff/${staffId}`,
      data
    ),

  remove: (restaurantId: string, staffId: string) =>
    api.delete<void>(`/staff/owner/restaurants/${restaurantId}/staff/${staffId}`),
};

