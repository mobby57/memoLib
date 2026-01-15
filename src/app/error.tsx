'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-600"
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

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Une erreur est survenue
          </h2>

          {/* Error message */}
          <p className="text-gray-600 mb-6">
            {error.message || 'Une erreur inattendue s\'est produite'}
          </p>

          {/* Error digest (for debugging) */}
          {error.digest && (
            <p className="text-xs text-gray-400 mb-6">
              Code d'erreur: {error.digest}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-4 w-full">
            <button
              onClick={reset}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Réessayer
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Accueil
            </button>
          </div>

          {/* Help text */}
          <p className="text-sm text-gray-500 mt-6">
            Si le problème persiste, contactez le support technique
          </p>
        </div>
      </div>
    </div>
  );
}
