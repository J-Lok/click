import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { ownerApi } from '../../api/owner';
import { useRestaurantStore } from '../../store/restaurantStore';
import {
  LayoutDashboard,
  Map,
  ShoppingCart,
  Utensils,
  Package,
  Users,
  UserCog,
  Menu,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getApiErrorMessage } from '../../lib/apiError';
import { allowedNav } from '../../lib/permissions';
import type { RestaurantSummary } from '../../types';

const ALL_NAV = [
  { path: '/dashboard', label: 'Dashboard',     icon: LayoutDashboard, resource: 'dashboard'  },
  { path: '/floor',     label: 'Plan de salle', icon: Map,             resource: 'floor'      },
  { path: '/orders',    label: 'Commandes',     icon: ShoppingCart,    resource: 'orders'     },
  { path: '/menu',      label: 'Menu',          icon: Utensils,        resource: 'menu'       },
  { path: '/stock',     label: 'Stock',         icon: Package,         resource: 'stock'      },
  { path: '/employees', label: 'Employés',      icon: Users,           resource: 'employees'  },
  { path: '/team',      label: 'Équipe',        icon: UserCog,         resource: 'team'       },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [restaurantError, setRestaurantError] = useState<string | null>(null);
  const location = useLocation();
  const currentRestaurantId = useRestaurantStore((s) => s.currentRestaurantId);
  const setCurrentRestaurantId = useRestaurantStore((s) => s.setCurrentRestaurantId);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!currentRestaurantId) {
      setRestaurantError(null);
      ownerApi
        .getMyRestaurants({ limit: 1 })
        .then((r) => {
          const list = r.data as RestaurantSummary[];
          if (list?.length && list[0]?.id) setCurrentRestaurantId(list[0].id);
        })
        .catch((err) => setRestaurantError(getApiErrorMessage(err)));
    }
  }, [currentRestaurantId, setCurrentRestaurantId]);

  const allowed = allowedNav(user?.role);
  const nav = ALL_NAV.filter((n) => allowed.includes(n.resource));

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <aside
        className={`${
          sidebarOpen ? 'w-56' : 'w-16'
        } bg-slate-800 border-r border-slate-600 flex flex-col transition-all duration-200 shrink-0`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-600">
          {sidebarOpen && <span className="font-semibold text-white truncate">Restaurant</span>}
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-1 rounded hover:bg-slate-700 text-slate-400"
            aria-label={sidebarOpen ? 'Réduire' : 'Agrandir'}
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {nav.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                location.pathname === path
                  ? 'bg-primary-500/20 text-primary-300'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
            </Link>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-2 border-t border-slate-600 space-y-1">
          {sidebarOpen && user && (
            <div className="px-3 py-2 text-xs text-slate-500 truncate">
              <p className="text-slate-300 font-medium truncate">{user.name}</p>
              <p className="truncate">{user.role}</p>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} className="shrink-0" />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 px-4 flex items-center justify-between border-b border-slate-600 bg-slate-800/80 shrink-0">
          <h1 className="text-lg font-medium text-white truncate">
            {ALL_NAV.find((n) => n.path === location.pathname)?.label ?? 'Restaurant'}
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            {user?.name && <span className="hidden sm:inline">{user.name}</span>}
            {user?.role && (
              <span className="px-2 py-0.5 rounded bg-slate-700 text-xs capitalize">
                {user.role.replace('_', ' ')}
              </span>
            )}
          </div>
        </header>

        {restaurantError && (
          <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            <AlertTriangle size={16} className="shrink-0" />
            <span>Impossible de charger le restaurant : {restaurantError}</span>
          </div>
        )}

        <div className="flex-1 p-4 overflow-auto bg-slate-900/50 min-h-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}