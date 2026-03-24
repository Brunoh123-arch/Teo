import * as React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      
      try {
        // Check if it's a Firestore JSON error
        if (this.state.error?.message.startsWith('{')) {
          const errData = JSON.parse(this.state.error.message);
          if (errData.error?.includes('insufficient permissions')) {
            errorMessage = "Você não tem permissão para realizar esta ação ou acessar estes dados.";
          }
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 rounded-full mb-6">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Ops! Algo deu errado</h1>
            <p className="text-gray-600 mb-8">
              {errorMessage}
            </p>
            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
            >
              <RefreshCcw size={20} />
              Tentar Novamente
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-8 text-left">
                <p className="text-xs font-mono text-gray-400 uppercase mb-2">Detalhes do Erro (Dev Only):</p>
                <pre className="text-xs bg-gray-100 p-4 rounded-lg overflow-auto max-h-40 text-red-800">
                  {this.state.error.toString()}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
