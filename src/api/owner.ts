import { api } from './client';
import type { OrderStatus } from '../types';

export type { OrderStatus };

export const ordersApi = {
  updateStatus: (orderId: string, status: OrderStatus) =>
    api.put(`/orders/${orderId}/status`, { status }),
};