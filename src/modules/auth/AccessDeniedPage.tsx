import { useAuthStore } from '../../store/authStore';
import { AlertTriangle } from 'lucide-react';

export function AccessDeniedPage() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="card max-w-md w-full p-6 text-center">
        <AlertTriangle className="mx-auto mb-4 text-amber-500" size={48} />
        <h1 className="text-xl font-bold text-white mb-2">Accès refusé</h1>
        <p className="text-slate-400 text-sm mb-6">
          Cette application est réservée aux propriétaires de restaurant. Votre compte n&apos;a pas
          les droits requis.
        </p>
        <button
          type="button"
          onClick={logout}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
