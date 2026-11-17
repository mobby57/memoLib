import { auth } from '@clerk/nextjs/server';
import { withTenantContext } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ClientPortalUI from './ClientPortalUI';
import { findActiveClientDossierGrant } from '@/lib/client-access';

export default async function ClientPortalPage({ params }: { params: Promise<{ locale: string, dossierId: string }> }) {
  const { userId } = await auth();
  const { dossierId, locale } = await params;

  if (!userId) redirect(`/${locale}/sign-in`);

  const access = await findActiveClientDossierGrant(userId, dossierId);
  if (!access) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 bg-white rounded-xl shadow-lg text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Accès refusé</h1>
          <p className="text-gray-600">Votre accès a été révoqué ou n’est pas valide.</p>
        </div>
      </div>
    );
  }

  const tenantId = access.grant.tenantId;
  const dossier = await withTenantContext<{
    id: string;
    typeDossier: string;
    objet: string | null;
  } | null>(tenantId, transaction =>
    transaction.dossier.findFirst({
      where: { id: dossierId, tenantId: access.grant.tenantId },
      select: { id: true, typeDossier: true, objet: true },
    })
  );
  if (!dossier) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-8 bg-white rounded-xl shadow-lg text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Accès refusé</h1>
          <p className="text-gray-600">Votre accès a été révoqué ou n’est pas valide.</p>
        </div>
      </div>
    );
  }

  const documents = await withTenantContext<Array<{
    id: string;
    filename: string;
    originalName: string;
    antivirusStatus: string | null;
  }>>(tenantId, transaction =>
    transaction.document.findMany({
      where: { dossierId, tenantId: access.grant.tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filename: true,
        originalName: true,
        antivirusStatus: true,
      },
    })
  );

  return <ClientPortalUI dossier={dossier} documents={documents} />;
}
