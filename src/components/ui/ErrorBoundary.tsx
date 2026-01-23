'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

/**
 * React Error Boundary
 * - Catches React component errors
 * - Displays user-friendly error message
 * - "Retry" button to reset state
 * - Error logging to console (dev) / Sentry (prod)
 * - Prevents entire app crash
 */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Store error info
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, send to error tracking service (Sentry, etc.)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Sentry
      // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error state if resetKeys change
    if (
      this.state.hasError &&
      this.props.resetKeys &&
      prevProps.resetKeys &&
      !areArraysEqual(this.props.resetKeys, prevProps.resetKeys)
    ) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            {/* Error Icon */}
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4 mx-auto">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error Title */}
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Oups ! Une erreur est survenue
            </h2>

            {/* Error Description */}
            <p className="text-gray-600 text-center mb-6">
              L'application a rencontré un problème inattendu. Veuillez réessayer.
            </p>

            {/* Error Details (dev only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 bg-gray-50 rounded p-3 text-xs">
                <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                  Détails de l'erreur (développement)
                </summary>
                <div className="space-y-2">
                  <div>
                    <strong className="text-red-600">Erreur:</strong>
                    <pre className="mt-1 whitespace-pre-wrap text-gray-700">
                      {this.state.error.message}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong className="text-red-600">Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-gray-700 overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={this.resetErrorBoundary}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                🔄 Réessayer
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                🏠 Retour à l'accueil
              </button>

              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  🔃 Recharger la page
                </button>
              )}
            </div>

            {/* Support Info */}
            <p className="text-xs text-gray-500 text-center mt-6">
              Si le problème persiste, contactez le support technique.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function areArraysEqual(a: Array<string | number>, b: Array<string | number>): boolean {
  return a.length === b.length && a.every((val, index) => val === b[index]);
}

/**
 * Higher-order component to wrap any component with ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
