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
  Menu,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const nav = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/floor', label: 'Plan de salle', icon: Map },
  { path: '/orders', label: 'Commandes', icon: ShoppingCart },
  { path: '/menu', label: 'Menu', icon: Utensils },
  { path: '/stock', label: 'Stock', icon: Package },
  { path: '/employees', label: 'Employés', icon: Users },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const currentRestaurantId = useRestaurantStore((s) => s.currentRestaurantId);
  const setCurrentRestaurantId = useRestaurantStore((s) => s.setCurrentRestaurantId);

  useEffect(() => {
    if (!currentRestaurantId) {
      ownerApi
        .getMyRestaurants({ limit: 1 })
        .then((r) => {
          const list = r.data as { id?: string }[];
          if (list?.length && list[0]?.id) setCurrentRestaurantId(list[0].id);
        })
        .catch(() => {});
    }
  }, [currentRestaurantId, setCurrentRestaurantId]);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <aside
        className={`${
          sidebarOpen ? 'w-56' : 'w-16'
        } bg-slate-800 border-r border-slate-600 flex flex-col transition-all shrink-0`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-600">
          {sidebarOpen && <span className="font-semibold text-white">Restaurant</span>}
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400"
            aria-label={sidebarOpen ? 'Réduire' : 'Agrandir'}
          >
            <Menu size={20} />
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                location.pathname === path
                  ? 'bg-primary-500/20 text-primary-300'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {sidebarOpen && <span>{label}</span>}
            </Link>
          ))}
        </nav>
        <div className="p-2 border-t border-slate-600">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-red-400"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 px-4 flex items-center justify-between border-b border-slate-600 bg-slate-800/80 shrink-0">
          <h1 className="text-lg font-medium text-white truncate">
            {nav.find((n) => n.path === location.pathname)?.label ?? 'Restaurant'}
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            {user?.name && <span>{user.name}</span>}
            {user?.role && (
              <span className="px-2 py-0.5 rounded bg-slate-700 text-xs">{user.role}</span>
            )}
          </div>
        </header>
        <div className="flex-1 p-4 overflow-auto bg-slate-900/50 min-h-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
