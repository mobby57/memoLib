'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Loader2, Mail, Send, User, Building } from 'lucide-react';
import { API_ENDPOINTS } from '@/lib/api-config';

const DEMO_STEPS = [
  { id: 1, label: 'Email entrant', href: '/demo/email-simulator' },
  { id: 2, label: 'Raisonnement dossier', href: '/demo/workspace-reasoning' },
  { id: 3, label: 'Preuve légale', href: '/demo/legal-proof' },
];

const TEST_CLIENTS = [
  { email: 'sophie.dubois@email.com', name: 'Sophie Dubois (dossier OQTF)' },
  { email: 'mehdi.benamar@email.com', name: 'Mehdi Benamar (renouvellement titre)' },
  { email: 'nouveau.client@email.com', name: 'Nouveau client (non enregistré)' },
];

const TEST_LAWYERS = [
  { email: 'jean.dupont@cabinet-dupont.fr', name: 'Maître Jean Dupont' },
  { email: 'sophie.martin@cabinet-martin.fr', name: 'Maître Sophie Martin' },
  { email: 'pierre.rousseau@cabinet-rousseau.fr', name: 'Maître Pierre Rousseau' },
];

const EMAIL_TEMPLATES = [
  {
    name: 'OQTF notifiée - recours urgent',
    subject: 'URGENT - OQTF notifiée le 15/01/2026 - besoin de recours',
    body: `Bonjour Maître,\n\nJ'ai reçu une OQTF le 15/01/2026 avec un délai de départ volontaire de 30 jours.\n\nJe suis en France depuis 5 ans avec mes deux enfants scolarisés.\n\nMerci pour votre aide.`,
  },
  {
    name: 'Demande de rendez-vous',
    subject: 'Demande de rendez-vous - renouvellement titre de séjour',
    body: `Bonjour Maître,\n\nJe souhaite prendre rendez-vous cette semaine pour mon dossier.\n\nMerci d'avance.`,
  },
  {
    name: 'Transmission de pièces',
    subject: 'Dossier OQTF - envoi des pièces complémentaires',
    body: `Bonjour Maître,\n\nJe vous envoie les pièces disponibles et je transmettrai les manquantes dès réception.`,
  },
];

type SendResult = {
  emailId?: string;
  workflowId?: string;
  category?: string;
  urgency?: string;
};

export default function EmailSimulatorPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [fromEmail, setFromEmail] = useState(TEST_CLIENTS[0].email);
  const [toEmail, setToEmail] = useState(TEST_LAWYERS[0].email);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const applyTemplate = (template: (typeof EMAIL_TEMPLATES)[number]) => {
    setSubject(template.subject);
    setBody(template.body);
  };

  const sendEmail = async () => {
    if (!fromEmail || !toEmail || !subject || !body) {
      setError('Tous les champs sont requis');
      return;
    }

    setSending(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(API_ENDPOINTS.EMAIL_INGEST, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromEmail,
          to: toEmail,
          subject,
          body,
          messageId: `test-${Date.now()}@simulator.local`,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || "Erreur lors de l'envoi");
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setSending(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 rounded-lg border border-slate-200 bg-white/90 p-3 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Parcours de démonstration</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {DEMO_STEPS.map((step) => {
              const isActive = step.id === 1;
              return (
                <Link
                  key={step.id}
                  href={step.href}
                  aria-current={isActive ? 'step' : undefined}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                    {step.id}
                  </span>
                  {step.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
            <Mail className="w-8 h-8 text-blue-600" />
            Simulateur d'Email Client
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Simulez des emails clients réalistes pour tester le tri et les actions avocat
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" suppressHydrationWarning>
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Send className="w-5 h-5" />
              Composer un email
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  De (Client)
                </label>
                <select
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  suppressHydrationWarning
                >
                  {TEST_CLIENTS.map((client) => (
                    <option key={client.email} value={client.email}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Building className="w-4 h-4 inline mr-1" />
                  À (Avocat)
                </label>
                <select
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  suppressHydrationWarning
                >
                  {TEST_LAWYERS.map((lawyer) => (
                    <option key={lawyer.email} value={lawyer.email}>
                      {lawyer.name} ({lawyer.email})
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Sujet de l'email..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                suppressHydrationWarning
              />

              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Contenu de l'email..."
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                suppressHydrationWarning
              />

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              {result && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Email envoyé avec succès</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-300 space-y-1">
                    <p><strong>Email ID:</strong> {result.emailId}</p>
                    {result.workflowId && <p><strong>Workflow ID:</strong> {result.workflowId}</p>}
                    {result.category && <p><strong>Catégorie:</strong> {result.category}</p>}
                    {result.urgency && <p><strong>Urgence:</strong> {result.urgency}</p>}
                  </div>
                </div>
              )}

              <button
                onClick={sendEmail}
                disabled={sending || !fromEmail || !toEmail || !subject || !body}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                suppressHydrationWarning
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Envoyer l'email
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Templates d'emails</h3>
            <div className="space-y-3">
              {EMAIL_TEMPLATES.map((template, index) => (
                <button
                  key={index}
                  onClick={() => applyTemplate(template)}
                  className="w-full text-left p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {template.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {template.subject}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">💡 Conseils</h4>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Utilisez des mots-clés comme "URGENT", "OQTF", "recours"</li>
                <li>• Mentionnez des dates et délais précis</li>
                <li>• Incluez le contexte familial/professionnel</li>
                <li>• Variez les niveaux d'urgence</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/demo/workspace-reasoning"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Étape suivante: Raisonnement dossier
            <span className="text-lg">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
