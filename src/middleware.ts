import { clerkMiddleware } from "@clerk/nextjs/server";

// IMPORTANT : Next.js n'active le middleware que s'il s'appelle `middleware.ts`
// (racine ou src/). Le fichier `proxy.ts` n'etait PAS reconnu, donc
// clerkMiddleware ne s'executait jamais -> <ClerkProvider>/<SignIn> plantaient
// en production (page noire). Ce fichier corrige la cause racine.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Clerk doit s'executer sur TOUTES les routes (pages + API) sauf :
    // - _next/ (internals Next.js)
    // - fichiers statiques (.css, .js, .png, etc.)
    // - /api/compliance/consent (RGPD anonyme, doit rester accessible sans auth)
    // - /api/webhooks/clerk (webhook Clerk signe, pas de session)
    //
    // Sans les routes API, auth() plante au runtime avec :
    //   "Clerk: auth() was called but Clerk can't detect usage of clerkMiddleware()"
    '/((?!_next/static|_next/image|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)|api/compliance/consent|api/webhooks/clerk).*)',
  ],
};
