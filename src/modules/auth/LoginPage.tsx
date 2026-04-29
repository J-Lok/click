import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { loginSchema, type LoginFormData } from '../../lib/validation';
import { useToast } from '../../shared/components/ToastProvider';

export function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const addToast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, from, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse(form);
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
      await login(form.username, form.password);
      addToast('Connexion réussie', 'success');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : 'Identifiants incorrects';
      addToast(String(msg), 'error');
      setErrors({ password: String(msg) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="card w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Restaurant Backoffice</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-primary-500"
              autoComplete="current-password"
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
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
          <div className="text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-slate-500 hover:text-primary-400 transition-colors"
            >
              Mot de passe oublié ?
            </Link>
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Pas encore de compte ?{' '}
          <Link to="/signup" className="text-primary-400 hover:underline">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
