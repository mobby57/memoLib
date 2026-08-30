import { NextResponse } from "next/server";

/**
 * Central security primitives.
 *
 * IMPORTANT:
 * This module must be wired to the application's real session/auth system.
 * Never trust tenantId supplied by the client.
 */

export type AuthorizedContext = {
  userId: string;
  tenantId: string;
  role?: string;
};

export function unauthorized() {
  return NextResponse.json(
    { error: "Non authentifié" },
    { status: 401 }
  );
}

export function forbidden() {
  return NextResponse.json(
    { error: "Accès interdit" },
    { status: 403 }
  );
}

/**
 * Replace this implementation with the project's actual auth/session lookup.
 *
 * SECURITY RULE:
 * tenantId MUST come from the authenticated server-side identity,
 * never from request JSON/query parameters.
 */
export async function requireAuthorizedContext(): Promise<AuthorizedContext> {
  throw new Error(
    "SECURITY: requireAuthorizedContext() must be connected to the real session provider"
  );
}

/**
 * Safe tenant constraint for Prisma queries.
 */
export function tenantWhere(
  tenantId: string,
  extra: Record<string, unknown> = {}
) {
  return {
    ...extra,
    tenantId,
  };
}

/**
 * Safe dossier constraint.
 *
 * Prefer this over:
 *
 *   where: { id: dossierId }
 *
 * because dossier IDs must never be the sole authorization boundary.
 */
export function dossierWhere(
  dossierId: string,
  tenantId: string,
  extra: Record<string, unknown> = {}
) {
  return {
    ...extra,
    id: dossierId,
    tenantId,
  };
}
