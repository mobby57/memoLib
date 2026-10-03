import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Pages uniquement — exclut Next internals, fichiers statiques,
    // et /api/compliance/consent (RGPD anonyme, ne doit pas passer par Clerk)
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)|api/compliance/consent).*)',
  ],
};
