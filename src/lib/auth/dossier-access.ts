/**
 * Dossier Access Control — couche de granularité complémentaire au RBAC global.
 *
 * RBAC global (src/lib/auth/rbac.ts) répond à :
 *   "Cet utilisateur a-t-il le droit de gérer des dossiers dans le cabinet ?"
 *
 * Ce module répond à :
 *   "Cet utilisateur a-t-il le droit d'agir sur CE dossier précis ?"
 *
 * Il ne remplace ni ne duplique le RBAC global : il s'appuie dessus.
 * Règle de résolution (dans cet ordre) :
 *   1. Isolation tenant (jamais d'accès cross-tenant).
 *   2. Admins globaux (SUPER_ADMIN/ADMIN/AVOCAT avec permission dossiers:manage) → accès total.
 *   3. Responsable du dossier (Dossier.responsableId) → accès total.
 *   4. Membre explicite du dossier (DossierMember) → accès selon son rôle dossier.
 *   5. Sinon refusé.
 */

import prisma from '@/lib/prisma';
import { buildRbacContext, RBAC_PERMISSIONS } from '@/lib/auth/rbac';

export type DossierAction = 'read' | 'write' | 'manage';

export const DOSSIER_MEMBER_ROLE_CAPABILITIES: Record<
  'OWNER' | 'RESPONSIBLE' | 'ATTORNEY' | 'COLLABORATOR' | 'VIEWER',
  DossierAction[]
> = {
  OWNER: ['read', 'write', 'manage'],
  RESPONSIBLE: ['read', 'write', 'manage'],
  ATTORNEY: ['read', 'write'],
  COLLABORATOR: ['read', 'write'],
  VIEWER: ['read'],
};

interface CanAccessDossierParams {
  userId: string;
  tenantId: string;
  role?: string;
  groups?: readonly string[];
  dossierId: string;
  action: DossierAction;
}

export interface DossierAccessResult {
  allowed: boolean;
  reason:
    | 'tenant_mismatch'
    | 'dossier_not_found'
    | 'global_admin'
    | 'responsable'
    | 'dossier_member'
    | 'team_member'
    | 'no_access';
}

/**
 * Vérifie si un utilisateur peut effectuer `action` sur `dossierId`.
 * Ne lève jamais d'exception métier : retourne { allowed: false, reason }.
 */
export async function canAccessDossier(
  params: CanAccessDossierParams
): Promise<DossierAccessResult> {
  const { userId, tenantId, role, groups, dossierId, action } = params;

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, tenantId },
    select: { id: true, tenantId: true, responsableId: true, teamId: true },
  });

  if (!dossier) {
    // Soit le dossier n'existe pas, soit il appartient à un autre tenant :
    // dans les deux cas on répond identiquement pour éviter de révéler
    // l'existence de dossiers d'autres tenants (anti-IDOR).
    return { allowed: false, reason: 'dossier_not_found' };
  }

  // 1. RBAC global : un admin/avocat du cabinet avec la permission
  // dossiers:manage garde un accès total (cohérent avec l'existant).
  const rbac = buildRbacContext({ role, groups });
  const hasGlobalManage =
    rbac.permissions.includes('*') ||
    rbac.permissions.includes(RBAC_PERMISSIONS.DOSSIERS_MANAGE);

  if (hasGlobalManage) {
    return { allowed: true, reason: 'global_admin' };
  }

  // 2. Responsable du dossier (notion métier existante) : accès total.
  if (dossier.responsableId && dossier.responsableId === userId) {
    return { allowed: true, reason: 'responsable' };
  }

  // 3. Membre explicite du dossier.
  const membership = await prisma.dossierMember.findUnique({
    where: { dossierId_userId: { dossierId, userId } },
    select: { role: true },
  });

  if (membership) {
    const capabilities = DOSSIER_MEMBER_ROLE_CAPABILITIES[membership.role as keyof typeof DOSSIER_MEMBER_ROLE_CAPABILITIES] || [];
    if (capabilities.includes(action)) {
      return { allowed: true, reason: 'dossier_member' };
    }
  }

  // 4. Héritage équipe → dossier : un membre de l'équipe assignée au dossier
  // hérite d'un accès en lecture/écriture (jamais 'manage', qui reste réservé
  // au RBAC global, au responsable ou à un DossierMember OWNER/RESPONSIBLE
  // explicite). Cela permet de partager un dossier avec toute une équipe
  // sans créer un DossierMember par personne.
  if (dossier.teamId && action !== 'manage') {
    const teamMembership = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: dossier.teamId, userId } },
      select: { id: true },
    });
    if (teamMembership) {
      return { allowed: true, reason: 'team_member' };
    }
  }

  // 5. Lecture simple : les utilisateurs disposant du RBAC global
  // dossiers:read peuvent au moins consulter (comportement actuel des
  // routes, qui ne filtraient jusqu'ici que par tenantId).
  if (
    action === 'read' &&
    (rbac.permissions.includes('*') || rbac.permissions.includes(RBAC_PERMISSIONS.DOSSIERS_READ))
  ) {
    return { allowed: true, reason: 'global_admin' };
  }

  return { allowed: false, reason: 'no_access' };
}
