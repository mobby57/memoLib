export const metadata = { title: 'Système — Super Admin' };

export default function SuperAdminSystemPage() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Système</h1>
      <p className="text-sm text-gray-500">
        État des services, versions, jobs cron. TODO : brancher
        <code className="mx-1 rounded bg-gray-100 px-1">api/health</code> et
        <code className="mx-1 rounded bg-gray-100 px-1">api/version</code>.
      </p>
    </main>
  );
}
