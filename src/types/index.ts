// ── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  role: string;
}

// ── Restaurant ────────────────────────────────────────────────────────────────

export interface RestaurantSummary {
  id: string;
  name: string;
}

// ── Menu ──────────────────────────────────────────────────────────────────────

export interface MenuItem {
  id: string;
  name: string;
  price?: number;
  category?: string;
  description?: string;
  is_available?: boolean;
  preparation_time?: number;
  stock_quantity?: number;
  low_stock_alert?: number;
  is_featured?: boolean;
  is_special?: boolean;
}

export interface LowStockItem {
  id: string;
  name: string;
  stock?: number;
  alert_level?: number;
}

// ── Orders ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'in_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface Order {
  id: string;
  user_name?: string;
  total_amount?: number;
  status?: OrderStatus;
  payment_status?: string;
  created_at?: string;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  has_more: boolean;
  page_size: number;
}

// ── Statistics ────────────────────────────────────────────────────────────────

export interface StatsSummary {
  total_revenue: number;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
}

export interface StatisticsResponse {
  summary?: StatsSummary;
}

// ── Team / RBAC ───────────────────────────────────────────────────────────────

export type StaffRole =
  | 'restaurant_owner'
  | 'manager'
  | 'cashier'
  | 'waiter'
  | 'chef'
  | 'delivery';

export interface StaffMember {
  id: string;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  role: StaffRole;
  is_active: boolean;
  created_at?: string;
  last_login?: string;
}

export interface InviteStaffPayload {
  name: string;
  username: string;
  password: string;
  phone?: string;
  email?: string;
  role: StaffRole;
}

export interface UpdateStaffPayload {
  name?: string;
  role?: StaffRole;
  is_active?: boolean;
  phone?: string;
  email?: string;
}

// Permissions per role — single source of truth for RBAC on the frontend
export const ROLE_PERMISSIONS: Record<StaffRole, string[]> = {
  restaurant_owner: ['*'],                                                    // all
  manager:          ['dashboard', 'orders', 'menu', 'stock', 'floor', 'employees', 'team'],
  cashier:          ['dashboard', 'orders', 'floor'],
  waiter:           ['floor', 'orders'],
  chef:             ['orders', 'stock', 'menu'],
  delivery:         ['orders'],
};

export const ROLE_LABELS: Record<StaffRole, string> = {
  restaurant_owner: 'Propriétaire',
  manager:          'Manager',
  cashier:          'Caissier·ère',
  waiter:           'Serveur·euse',
  chef:             'Chef cuisinier',
  delivery:         'Livreur·euse',
};

export const STAFF_ROLES: StaffRole[] = [
  'manager',
  'cashier',
  'waiter',
  'chef',
  'delivery',
];