import { clerkMiddleware } from "@clerk/nextjs/server";

// clerkMiddleware protège les pages. Fichier nommé `middleware.ts` (convention
// reconnue de façon fiable par Clerk au runtime ; `proxy.ts` de Next 16 n'était
// pas enregistré comme middleware actif -> auth() échouait en prod).
// Exclusions : Next internals, fichiers statiques, /api/compliance/consent
// (RGPD anonyme) et /api/webhooks/clerk (webhook entrant).
export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)|api/compliance/consent|api/webhooks/clerk).*)',
  ],
};
