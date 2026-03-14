import { Component, ErrorInfo, ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AppErrorBoundary] Render crash', {
      error,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex items-center justify-center px-4">
          <div className="max-w-sm w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 text-center space-y-3">
            <h1 className="text-lg font-semibold">Noe gikk galt</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Appen krasjet under lasting. Prøv å laste siden på nytt.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              Last inn på nytt
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
