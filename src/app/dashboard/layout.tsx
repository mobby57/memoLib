// Force dynamic rendering for all dashboard pages
// These pages require authentication and cannot be statically generated
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
