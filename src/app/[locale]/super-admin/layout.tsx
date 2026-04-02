// Force dynamic rendering for all super-admin pages
// These pages require authentication and cannot be statically generated
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
