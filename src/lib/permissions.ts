import type { StaffRole } from '../types';
import { ROLE_PERMISSIONS } from '../types';

/**
 * Returns true if the given role has access to the given resource/page key.
 * restaurant_owner always has access to everything ('*').
 */
export function hasPermission(role: string | undefined, resource: string): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role as StaffRole];
  if (!perms) return false;
  return perms.includes('*') || perms.includes(resource);
}

/**
 * Returns the list of nav items this role can see.
 */
export function allowedNav(role: string | undefined): string[] {
  if (!role) return [];
  const perms = ROLE_PERMISSIONS[role as StaffRole];
  if (!perms) return [];
  if (perms.includes('*')) return ['dashboard', 'floor', 'orders', 'menu', 'stock', 'employees', 'team'];
  return perms;
}