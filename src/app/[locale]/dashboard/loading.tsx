// Dashboard Loading UI - Skeleton pour le tableau de bord
// https://nextjs.org/docs/app/api-reference/file-conventions/loading

export default function DashboardLoading() {
  return (
    <div className="p-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        </div>
        <div className="divide-y dark:divide-gray-700">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
