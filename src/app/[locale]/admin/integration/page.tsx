'use client';

export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Copy, Check, ExternalLink, Globe, Users, Shield } from 'lucide-react';
import AdminNavigation from '@/components/AdminNavigation';

export default function IntegrationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    else if (session?.user && !['ADMIN', 'AVOCAT', 'ASSOCIE'].includes(session.user.role || ''))
      router.push('/dashboard');
  }, [session, status, router]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://memolib.space';

  const links = [
    {
      id: 'login',
      label: 'Connexion équipe',
      description: 'Lien de connexion pour vous et vos collaborateurs.',
      url: `${baseUrl}/login`,
      icon: Shield,
      usage: 'Ajoutez ce lien dans votre intranet ou en signet.',
    },
    {
      id: 'client-portal',
      label: 'Portail client',
      description: 'Espace personnel pour vos clients (suivi dossier, documents, messages).',
      url: `${baseUrl}/client-dashboard`,
      icon: Users,
      usage: 'Intégrez ce lien sur votre site web : "Suivre mon dossier".',
    },
    {
      id: 'contact',
      label: 'Formulaire de contact',
      description: 'Page de contact pour les demandes entrantes.',
      url: `${baseUrl}/contact`,
      icon: Globe,
      usage: 'Remplacez ou complétez le formulaire de contact de votre site.',
    },
  ];

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const embedSnippet = `<!-- Bouton MemoLib - Portail Client -->
<a href="${baseUrl}/client-dashboard"
   target="_blank"
   rel="noopener"
   style="display:inline-flex;align-items:center;gap:8px;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;font-weight:600;text-decoration:none;">
  ⚖️ Suivre mon dossier
</a>`;

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <AdminNavigation />

      <main className="max-w-4xl mx-auto px-8 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Intégration avec votre site web</h1>
          <p className="text-gray-600 mt-2">
            Connectez MemoLib à votre site existant. Vos clients accèdent à leur espace depuis votre site, vos collaborateurs se connectent directement.
          </p>
        </div>

        {/* Liens directs */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Liens à intégrer</h2>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <div key={link.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{link.label}</h3>
                    <p className="text-sm text-gray-600 mt-1">{link.description}</p>
                    <p className="text-xs text-gray-500 mt-1 italic">{link.usage}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-800 truncate">
                        {link.url}
                      </code>
                      <button
                        onClick={() => copyToClipboard(link.url, link.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Copier"
                      >
                        {copied === link.id ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <Copy className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Ouvrir"
                      >
                        <ExternalLink className="w-5 h-5 text-gray-500" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Code embed */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Code à intégrer (HTML)</h2>
          <p className="text-sm text-gray-600">
            Copiez ce bouton HTML et collez-le sur votre site web pour permettre à vos clients d'accéder à leur espace.
          </p>
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 rounded-xl p-6 text-sm overflow-x-auto">
              <code>{embedSnippet}</code>
            </pre>
            <button
              onClick={() => copyToClipboard(embedSnippet, 'embed')}
              className="absolute top-3 right-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
            >
              {copied === 'embed' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied === 'embed' ? 'Copié !' : 'Copier'}
            </button>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium">Aperçu :</p>
            <div className="mt-3">
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                ⚖️ Suivre mon dossier
              </a>
            </div>
          </div>
        </section>

        {/* Info sécurité */}
        <section className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-green-900 flex items-center gap-2">
            <Shield className="w-5 h-5" /> Sécurité
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-green-800">
            <li>• Les clients doivent être connectés pour accéder à leur espace</li>
            <li>• Chaque client ne voit que ses propres dossiers (isolation multi-tenant)</li>
            <li>• Les connexions sont chiffrées (HTTPS) et les sessions expirent après 1h d'inactivité</li>
            <li>• Compatible avec votre site WordPress, Wix, Squarespace ou HTML</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
