/* Error Boundary */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900/50 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl backdrop-blur">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-rose-900/50">
                <AlertTriangle className="h-8 w-8 text-rose-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Algo salió mal</h2>
            <p className="text-slate-400 text-sm mb-6">
              Ha ocurrido un error inesperado. Por favor, recarga la página o contacta al soporte.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;