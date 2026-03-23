import { api } from './client';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'in_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export const ordersApi = {
  updateStatus: (orderId: string, status: OrderStatus) =>
    api.put(`/orders/${orderId}/status`, { status }),
};
