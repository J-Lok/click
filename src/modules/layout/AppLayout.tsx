import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { ownerApi } from '../../api/owner';
import { useRestaurantStore } from '../../store/restaurantStore';
import { restaurantsApi } from '../../api/restaurants';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../shared/components/ToastProvider';
import {
  LayoutDashboard,
  Map,
  ShoppingCart,
  Utensils,
  Package,
  BarChart3,
  Users,
  Menu,
  LogOut,
  ChevronRight,
  Store,
} from 'lucide-react';

const nav = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/floor', label: 'Plan de salle', icon: Map },
  { path: '/orders', label: 'Commandes', icon: ShoppingCart },
  { path: '/menu', label: 'Menu', icon: Utensils },
  { path: '/stock', label: 'Stock', icon: Package },
  { path: '/statistics', label: 'Statistiques', icon: BarChart3 },
  { path: '/employees', label: 'Employés', icon: Users },
  { path: '/restaurant', label: 'Mon restaurant', icon: Store },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const location = useLocation();
  const currentRestaurantId = useRestaurantStore((s) => s.currentRestaurantId);
  const setCurrentRestaurantId = useRestaurantStore((s) => s.setCurrentRestaurantId);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const addToast = useToast();
  const [restaurantName, setRestaurantName] = useState<string>('');

  // Resolve current restaurant for this user on mount / user change
  useEffect(() => {
    if (!user?.role) return;
    if (user.role !== 'restaurant_owner' && user.role !== 'admin') return;

    ownerApi
      .getMyRestaurants({ limit: 1 })
      .then((r) => {
        const list = r.data as { id?: string }[];
        if (list?.length && list[0]?.id) {
          setCurrentRestaurantId(list[0].id);
        } else {
          setCurrentRestaurantId(null);
        }
      })
      .catch(() => {
        addToast('Impossible de charger votre restaurant. Vérifiez votre connexion.', 'error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  // Fetch restaurant name whenever restaurant changes
  useEffect(() => {
    if (!currentRestaurantId) {
      setRestaurantName('');
      return;
    }
    restaurantsApi
      .get(currentRestaurantId)
      .then((r) => {
        const name = (r.data as { name?: string }).name;
        if (name) setRestaurantName(name);
      })
      .catch(() => {
        setRestaurantName('');
      });
  }, [currentRestaurantId]);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [location.pathname]);

  const currentNavLabel = nav.find((n) => location.pathname.startsWith(n.path))?.label;

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          bg-slate-800 border-r border-slate-700 flex flex-col transition-all duration-200 shrink-0
          fixed md:relative z-30 h-full md:h-auto w-56
          ${sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full md:translate-x-0 md:w-16'
          }
        `}
      >
        {/* Header */}
        <div className="h-14 px-3 flex items-center justify-between border-b border-slate-700 shrink-0">
          {sidebarOpen && (
            <div className="min-w-0 flex-1 mr-2">
              {restaurantName ? (
                <span className="font-semibold text-white truncate block text-sm">
                  {restaurantName}
                </span>
              ) : (
                <div className="h-3 bg-slate-700 rounded animate-pulse w-24" />
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
            aria-label={sidebarOpen ? 'Réduire le menu' : 'Agrandir le menu'}
          >
            {sidebarOpen ? <ChevronRight size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {nav.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path || location.pathname.startsWith(path + '/');
            return (
              <Link
                key={path}
                to={path}
                title={!sidebarOpen ? label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-emerald-600/20 text-emerald-400'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {sidebarOpen && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-slate-700 shrink-0">
          {sidebarOpen && user && (
            <div className="px-3 py-2 mb-1">
              <p className="text-xs font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.role}</p>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            title={!sidebarOpen ? 'Déconnexion' : undefined}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-colors text-sm"
          >
            <LogOut size={18} className="shrink-0" />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 md:ml-0">
        {/* Topbar */}
        <header className="h-14 px-4 flex items-center justify-between border-b border-slate-700 bg-slate-800/80 backdrop-blur shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 md:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-base font-semibold text-white">
              {currentNavLabel ?? 'Restaurant'}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            {user?.name && (
              <span className="hidden sm:block truncate max-w-[140px]">{user.name}</span>
            )}
            {user?.role && (
              <span className="px-2 py-0.5 rounded-md bg-slate-700 text-xs text-slate-300">
                {user.role}
              </span>
            )}
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 overflow-auto bg-slate-900/30 min-h-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
