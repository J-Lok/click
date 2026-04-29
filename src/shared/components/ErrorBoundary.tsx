import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      const showDetails = import.meta.env.DEV;
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
          <div className="card max-w-md w-full p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle size={32} className="text-red-400" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-red-400 mb-2">Une erreur est survenue</h2>
              <p className="text-slate-400 text-sm">
                {showDetails
                  ? (this.state.error?.message ?? 'Erreur inconnue')
                  : 'Veuillez rafraîchir la page. Si le problème persiste, contactez le support.'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw size={16} />
                Rafraîchir la page
              </button>
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
              >
                Réessayer sans recharger
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
