export const metadata = { title: 'Analytics — Super Admin' };

export default function SuperAdminAnalyticsPage() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <p className="text-sm text-gray-500">
        Vue globale des métriques multi-tenant. TODO : brancher
        <code className="mx-1 rounded bg-gray-100 px-1">api/super-admin/stats</code>.
      </p>
    </main>
  );
}
