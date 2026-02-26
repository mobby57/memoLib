// Global Loading UI - Affich�e pendant le chargement des routes
// https://nextjs.org/docs/app/api-reference/file-conventions/loading

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner anim� */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 dark:border-gray-600"></div>
          <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin"></div>
        </div>
        
        {/* Texte de chargement */}
        <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
          Chargement...
        </p>
      </div>
    </div>
  );
}
