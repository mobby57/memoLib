import { ReactNode } from 'react';

export default function ClientPortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* En-tête ultra-épuré (pas de menu avocat) */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <span className="font-semibold text-slate-800 text-lg tracking-tight">MemoLib Portail</span>
        </div>
      </header>

      {/* Contenu de l'espace client */}
      <main className="flex-1">
        {children}
      </main>

      {/* Pied de page discret */}
      <footer className="py-6 text-center text-xs text-slate-400">
        Espace sécurisé &bull; Vos données sont chiffrées et protégées
      </footer>
    </div>
  );
}
