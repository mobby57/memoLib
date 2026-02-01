// Force dynamic rendering for client dashboard
// These pages require authentication and cannot be statically generated
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
