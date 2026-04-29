import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { signupSimpleSchema, type SignupSimpleFormData } from '../../lib/validation';
import { useToast } from '../../shared/components/ToastProvider';

export function SignupPage() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    name: '',
    phone: '+237',
    email: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignupSimpleFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const setTokens = useAuthStore((s) => s.setTokens);
  const loadUser = useAuthStore((s) => s.loadUser);
  const addToast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSimpleSchema.safeParse({
      ...form,
      email: form.email || undefined,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        const path = err.path[0] as string;
        fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const { data } = await authApi.signupSimple({
        username: parsed.data.username,
        password: parsed.data.password,
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || undefined,
      });
      setTokens(data.access_token, data.refresh_token);
      await loadUser();
      addToast('Compte créé. Créez maintenant votre restaurant.', 'success');
      navigate('/create-restaurant', { replace: true });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : "Erreur lors de l'inscription";
      addToast(String(msg), 'error');
      setErrors({ username: String(msg) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="card w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Créer un compte</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
              Nom complet
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-primary-500"
              autoComplete="name"
              disabled={loading}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400" role="alert">
                {errors.name}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1">
              Nom d&apos;utilisateur
            </label>
            <input
              id="username"
              type="text"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-primary-500"
              autoComplete="username"
              disabled={loading}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-400" role="alert">
                {errors.username}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-1">
              Téléphone (+237XXXXXXXXX)
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+237690000000"
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-primary-500"
              autoComplete="tel"
              disabled={loading}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-400" role="alert">
                {errors.phone}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
              Email (optionnel)
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-primary-500"
              autoComplete="email"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-primary-500"
              autoComplete="new-password"
              disabled={loading}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-400" role="alert">
                {errors.password}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-primary-400 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
