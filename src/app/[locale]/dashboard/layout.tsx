'use client';

import { DemoBanner } from '@/components/DemoBanner';

// Force dynamic rendering for all dashboard pages
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DemoBanner />
      {children}
    </>
  );
}
