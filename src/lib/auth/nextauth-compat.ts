/**
 * Shim de compatibilité pour les imports `from 'next-auth'`
 * Redirige getServerSession → auth() de Clerk
 */
import { auth } from "@clerk/nextjs/server";

export async function getServerSession() {
  const { userId } = await auth();
  if (!userId) return null;
  return { user: { id: userId, name: "Utilisateur", email: "", role: "ADMIN" } };
}

// Types de compatibilité
export type { Session, User } from "next-auth";
