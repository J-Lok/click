import { Component, ErrorInfo, ReactNode } from 'react';

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
          <div className="card max-w-md w-full p-6 text-center">
            <h2 className="text-xl font-semibold text-red-400 mb-2">
              Une erreur est survenue
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              {showDetails
                ? (this.state.error?.message ?? 'Erreur inconnue')
                : 'Veuillez rafraîchir la page. Si le problème persiste, contactez le support.'}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
