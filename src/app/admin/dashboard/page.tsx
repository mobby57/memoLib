export default function AdminDashboardPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500">Overview of key metrics and system health.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          { label: 'Active Users', value: '1,248' },
          { label: 'Monthly Revenue', value: '$42,550' },
          { label: 'Support Tickets', value: '7 open' },
          { label: 'Sync Success Rate', value: '99.5%' },
          { label: 'Utilisation Analyse', value: '58k inférences' },
          { label: 'Storage Used', value: '318 GB' },
        ].map(stat => (
          <article
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{stat.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
