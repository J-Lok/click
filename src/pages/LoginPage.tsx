import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { loginSchema, type LoginFormData } from '../lib/validation';
import { useToast } from '../shared/components/ToastProvider';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const addToast = useToast();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse({ username, password });
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as keyof LoginFormData;
        if (key) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await login(username, password);
      addToast('Connexion réussie', 'success');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : 'Identifiants incorrects';
      addToast(typeof msg === 'string' ? msg : 'Erreur de connexion', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="card w-full max-w-sm p-6">
        <h1 className="text-xl font-semibold text-center mb-6">Restaurant Backoffice</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm text-slate-400 mb-1">
              Nom d&apos;utilisateur
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoComplete="username"
              disabled={loading}
            />
            {errors.username && (
              <p className="text-red-400 text-xs mt-1">{errors.username}</p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-slate-400 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoComplete="current-password"
              disabled={loading}
            />
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
