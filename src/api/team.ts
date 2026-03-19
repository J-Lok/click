import { api } from './client';
import type { InviteStaffPayload, UpdateStaffPayload } from '../types';

export const teamApi = {
  /** List all staff members for a restaurant */
  list: (restaurantId: string) =>
    api.get(`/restaurants/${restaurantId}/staff`),

  /** Invite / create a new staff member */
  invite: (restaurantId: string, data: InviteStaffPayload) =>
    api.post(`/restaurants/${restaurantId}/staff`, data),

  /** Update role, status, or profile of a staff member */
  update: (restaurantId: string, staffId: string, data: UpdateStaffPayload) =>
    api.put(`/restaurants/${restaurantId}/staff/${staffId}`, data),

  /** Deactivate (soft-delete) a staff member */
  deactivate: (restaurantId: string, staffId: string) =>
    api.delete(`/restaurants/${restaurantId}/staff/${staffId}`),
};