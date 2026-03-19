import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useRestaurantStore } from '../../store/restaurantStore';
import { restaurantsApi } from '../../api/restaurants';
import { useToast } from '../../shared/components/ToastProvider';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function CreateRestaurantPage() {
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    phone: '+237',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);
  const setTokens = useAuthStore((s) => s.setTokens);
  const loadUser = useAuthStore((s) => s.loadUser);
  const setCurrentRestaurantId = useRestaurantStore((s) => s.setCurrentRestaurantId);
  const addToast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'restaurant_owner') {
      navigate('/dashboard', { replace: true });
    }
  }, [user?.role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.address.trim() || !form.phone.trim() || !form.email.trim()) {
      setError('Remplissez tous les champs obligatoires.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || form.name.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        coordinates: { latitude: 4.0483, longitude: 9.7043 },
        opening_hours: DAYS.map((day) => ({
          day,
          open_time: '08:00',
          close_time: '22:00',
          is_closed: false,
        })),
        delivery_zones: [],
      };
      const { data } = await restaurantsApi.create(payload);
      if (data.access_token && data.refresh_token) {
        setTokens(data.access_token, data.refresh_token);
        await loadUser();
      }
      if (data.restaurant?.id) {
        setCurrentRestaurantId(data.restaurant.id);
      }
      addToast('Restaurant créé. Vous pouvez maintenant gérer votre menu.', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : 'Erreur lors de la création du restaurant';
      setError(String(msg));
      addToast(String(msg), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="card w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-center mb-2">Créer mon restaurant</h1>
        <p className="text-sm text-slate-400 text-center mb-6">
          Renseignez les informations de base. Vous pourrez modifier ensuite.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="restaurant-name" className="block text-sm font-medium text-slate-300 mb-1">
              Nom du restaurant *
            </label>
            <input
              id="restaurant-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-primary-500"
              placeholder="Mon restaurant"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="restaurant-desc" className="block text-sm font-medium text-slate-300 mb-1">
              Description (optionnel)
            </label>
            <textarea
              id="restaurant-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Brève description"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="restaurant-address" className="block text-sm font-medium text-slate-300 mb-1">
              Adresse *
            </label>
            <input
              id="restaurant-address"
              type="text"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-primary-500"
              placeholder="Ville, quartier, rue"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="restaurant-phone" className="block text-sm font-medium text-slate-300 mb-1">
              Téléphone *
            </label>
            <input
              id="restaurant-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-primary-500"
              placeholder="+237690000000"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="restaurant-email" className="block text-sm font-medium text-slate-300 mb-1">
              Email *
            </label>
            <input
              id="restaurant-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-primary-500"
              placeholder="contact@restaurant.com"
              disabled={loading}
            />
          </div>
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer mon restaurant'}
          </button>
        </form>
      </div>
    </div>
  );
}
