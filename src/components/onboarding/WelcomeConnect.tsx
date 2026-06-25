'use client';

import { useState } from 'react';
import { Mail, Shield, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

interface Props {
  onSkip: () => void;
}

/**
 * Écran simplifié de première connexion V3 :
 * "Connectez votre boîte mail. MemoLib détecte automatiquement vos dossiers."
 */
export function WelcomeConnect({ onSkip }: Props) {
  const [connecting, setConnecting] = useState<'gmail' | 'outlook' | null>(null);

  const connectGmail = () => {
    setConnecting('gmail');
    window.location.href = '/api/oauth/gmail/connect';
  };

  const connectOutlook = () => {
    setConnecting('outlook');
    window.location.href = '/api/oauth/authorize?provider=microsoft';
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 max-w-lg w-full p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Bienvenue dans MemoLib
        </h1>
        <p className="text-gray-600 mb-8">
          Connectez votre boîte mail. MemoLib détecte automatiquement vos dossiers, les risques, les délais et les actions à réaliser.
        </p>

        <div className="space-y-3 mb-6">
          <button
            onClick={connectGmail}
            disabled={!!connecting}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50"
          >
            {connecting === 'gmail' ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <Mail className="w-5 h-5 text-red-500" />
            )}
            <span className="font-semibold text-gray-900">Connecter Gmail</span>
            <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
          </button>

          <button
            onClick={connectOutlook}
            disabled={!!connecting}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50"
          >
            {connecting === 'outlook' ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <Mail className="w-5 h-5 text-blue-600" />
            )}
            <span className="font-semibold text-gray-900">Connecter Outlook</span>
            <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
          </button>
        </div>

        <div className="flex items-start gap-2 text-left bg-green-50 border border-green-200 rounded-xl p-3 mb-6">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-green-700">
            Vos données restent privées. MemoLib analyse localement vos emails pour détecter vos clients et procédures CESEDA.
          </p>
        </div>

        <button
          onClick={onSkip}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Configurer plus tard
        </button>
      </div>
    </div>
  );
}
