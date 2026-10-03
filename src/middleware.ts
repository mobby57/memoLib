import { clerkMiddleware } from "@clerk/nextjs/server";

// IMPORTANT : Next.js n'active le middleware que s'il s'appelle `middleware.ts`
// (racine ou src/). Le fichier `proxy.ts` n'etait PAS reconnu, donc
// clerkMiddleware ne s'executait jamais -> <ClerkProvider>/<SignIn> plantaient
// en production (page noire). Ce fichier corrige la cause racine.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Pages uniquement — exclut Next internals, fichiers statiques,
    // et /api/compliance/consent (RGPD anonyme, ne doit pas passer par Clerk)
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)|api/compliance/consent).*)',
  ],
};
