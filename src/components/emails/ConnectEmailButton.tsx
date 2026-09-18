'use client';

import { useParams } from 'next/navigation'
import { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ConnectEmailButtonProps {
  provider?: 'gmail' | 'outlook';
  connectedEmail?: string | null;
  onConnect?: () => void;
  className?: string;
}

/**
 * Bouton "Connecter Gmail" / "Connecter Outlook"
 * Redirige vers le flow OAuth pour autoriser l'accès à la boîte mail.
 */
export function ConnectEmailButton({
  provider = 'gmail',
  connectedEmail,
  onConnect,
  className = '',
}: ConnectEmailButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    setLoading(true);
    // Redirection vers le flow OAuth
    window.location.href = `/api/email/connect/${provider}`;
  };

  if (connectedEmail) {
    return (
      <div className={`flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl ${className}`}>
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-900">Boîte mail connectée</p>
          <p className="text-xs text-green-700">{connectedEmail}</p>
        </div>
      </div>
    );
  }

  const config = {
    gmail: {
      label: 'Connecter Gmail',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      ),
      bg: 'bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-300',
      text: 'text-gray-700',
    },
    outlook: {
      label: 'Connecter Outlook',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576a.806.806 0 01-.588.234h-8.522v-8.97L16.2 11.2l1.548-1.452V7.387l-3.096 2.186L12 7.387V6.2c0-.16.054-.297.162-.41a.554.554 0 01.41-.164h10.604c.232 0 .426.078.586.234.16.156.238.35.238.578v.95z" />
          <path fill="#0078D4" d="M14.652 12.756V20H5.174a.806.806 0 01-.588-.234.768.768 0 01-.238-.578V4.812c0-.228.08-.422.238-.578a.806.806 0 01.588-.234h8.522v7.804l.956.952z" />
          <path fill="#28A8EA" d="M9.652 8.422c-.67 0-1.232.228-1.684.684C7.516 9.562 7.29 10.16 7.29 10.9c0 .74.226 1.34.678 1.8.452.46 1.014.69 1.684.69.67 0 1.232-.23 1.684-.69.452-.46.678-1.06.678-1.8 0-.74-.226-1.338-.678-1.794-.452-.456-1.014-.684-1.684-.684z" />
        </svg>
      ),
      bg: 'bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-400',
      text: 'text-gray-700',
    },
  };

  const c = config[provider];

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className={`flex items-center justify-center gap-3 w-full py-3.5 px-5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md ${c.bg} ${c.text} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        c.icon
      )}
      <span>{loading ? 'Connexion...' : c.label}</span>
    </button>
  );
}

/**
 * Panneau de connexion email complet (Gmail + Outlook + IMAP)
 */
export function ConnectEmailPanel({
  connectedEmail,
}: {
  connectedEmail?: string | null;
}) {
  return (
    <div className="space-y-3">
      <ConnectEmailButton provider="gmail" connectedEmail={connectedEmail} />
      <ConnectEmailButton provider="outlook" />
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <div className="flex-1 h-px bg-gray-200" />
        <span>ou configuration manuelle</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      <a
        href="/fr/settings/emails/imap"
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-all"
      >
        <Mail className="w-4 h-4" />
        Configurer IMAP manuellement
      </a>
    </div>
  );
}
