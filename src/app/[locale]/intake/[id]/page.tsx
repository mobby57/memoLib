'use client';

export const dynamic = 'force-dynamic';

import { useParams } from 'next/navigation';
import { Breadcrumb } from '@/components/ui';
import { IntakeForm } from '@/components/intake/IntakeForm';

/**
 * Page de complétion d'une demande d'intake client.
 * Le widget "demandes à traiter" pointe ici (/intake/[id]).
 */
export default function IntakeDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6 p-6">
      <Breadcrumb items={[{ label: 'Demandes', href: '..' }, { label: 'Détail' }]} />
      <IntakeForm id={id} />
    </div>
  );
}
