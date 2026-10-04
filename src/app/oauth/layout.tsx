// Le callback OAuth ne doit jamais être prérendu statiquement (contexte client
// runtime requis). `dynamic` est défini ICI (layout = Server Component) car la
// directive route-segment est IGNORÉE dans un fichier 'use client' (la page).
export const dynamic = 'force-dynamic';

export default function OAuthLayout({ children }: { children: React.ReactNode }) {
  // Un layout App Router imbriqué ne doit PAS rendre <html>/<body> (seul le
  // layout racine le fait).
  return <>{children}</>;
}
