import { clerkMiddleware } from "@clerk/nextjs/server";

// Next 16 : le fichier d'interception s'appelle `proxy.ts` (ex-`middleware.ts`).
// clerkMiddleware protège les pages ; exclusions = Next internals, fichiers
// statiques, /api/compliance/consent (RGPD anonyme) et /api/webhooks/clerk
// (webhook entrant, ne doit pas passer par l'auth Clerk).
export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)|api/compliance/consent|api/webhooks/clerk).*)',
  ],
};
