'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, Mail, Send, User, Building } from 'lucide-react';
import { DemoProgressBar } from '@/components/demo/DemoProgressBar';
import { DemoStepCTA } from '@/components/demo/DemoStepCTA';

const TEST_CLIENTS = [
  { email: 'client.demo@example.invalid', name: 'Client fictif (exemple)' },
  { email: 'nouveau.client@example.invalid', name: 'Nouveau client fictif' },
];

const TEST_LAWYERS = [
  { email: 'cabinet.demo@example.invalid', name: 'Cabinet fictif' },
  { email: 'collaborateur.demo@example.invalid', name: 'Collaborateur fictif' },
];

const EMAIL_TEMPLATES = [
  {
    name: 'Document à examiner',
    subject: 'Demande de revue d’un document',
    body: `Bonjour Maître,\n\nJe souhaite faire examiner un document reçu récemment. La date de notification et les informations utiles restent à vérifier sur la pièce originale.\n\nPouvez-vous m’indiquer les prochaines étapes ?`,
  },
  {
    name: 'Demande de rendez-vous',
    subject: 'Demande de rendez-vous',
    body: `Bonjour Maître,\n\nJe souhaite prendre rendez-vous pour faire le point sur ma situation.\n\nMerci d'avance.`,
  },
  {
    name: 'Transmission de pièces',
    subject: 'Transmission de pièces complémentaires',
    body: `Bonjour Maître,\n\nJe transmets des pièces complémentaires pour examen. Merci de me confirmer leur bonne réception.`,
  },
];

type DemoAnalysis = {
  category: string;
  urgency: string;
  nextStep: string;
  deadline: string;
};

function analyzeDemoMessage(subject: string, body: string): DemoAnalysis {
  const text = `${subject} ${body}`.toLocaleLowerCase('fr-FR');
  let category = 'Message à qualifier';

  if (text.includes('rendez-vous')) {
    category = 'Demande de rendez-vous';
  } else if (text.includes('pièce') || text.includes('document')) {
    category = 'Document ou pièce à examiner';
  }

  return {
    category,
    urgency: /urgent|urgence|délai|échéance/.test(text)
      ? 'Terme d’urgence détecté — à vérifier par un professionnel'
      : 'À évaluer par le cabinet',
    nextStep: 'Relire le message et vérifier les pièces originales.',
    deadline: 'Aucune échéance calculée',
  };
}

export default function EmailSimulatorPage() {
  const [fromEmail, setFromEmail] = useState(TEST_CLIENTS[0].email);
  const [toEmail, setToEmail] = useState(TEST_LAWYERS[0].email);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<DemoAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyTemplate = (template: (typeof EMAIL_TEMPLATES)[number]) => {
    setSubject(template.subject);
    setBody(template.body);
  };

  const simulateEmail = () => {
    if (!fromEmail || !toEmail || !subject || !body) {
      setError('Tous les champs sont requis');
      return;
    }

    setSending(true);
    setError(null);
    setResult(null);

    window.setTimeout(() => {
      setResult(analyzeDemoMessage(subject, body));
      setSending(false);
    }, 350);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <DemoProgressBar />
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
            <Mail className="w-8 h-8 text-blue-600" />
            Simulateur de message
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Essayez un tri indicatif sur des exemples fictifs, directement dans votre navigateur
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Mode démonstration local : rien n’est envoyé, enregistré ou transmis à une IA. Le résultat
          est indicatif et ne calcule aucun délai juridique.
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" suppressHydrationWarning>
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Send className="w-5 h-5" />
              Composer un exemple fictif
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  De (Client)
                </label>
                <select
                  value={fromEmail}
                  onChange={e => setFromEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  suppressHydrationWarning
                >
                  {TEST_CLIENTS.map(client => (
                    <option key={client.email} value={client.email}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Building className="w-4 h-4 inline mr-1" />
                  Cabinet de démonstration (non contacté)
                </label>
                <select
                  value={toEmail}
                  onChange={e => setToEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  suppressHydrationWarning
                >
                  {TEST_LAWYERS.map(lawyer => (
                    <option key={lawyer.email} value={lawyer.email}>
                      {lawyer.name} ({lawyer.email})
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Sujet de l'email..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                suppressHydrationWarning
              />

              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
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
                    <span className="font-semibold">Simulation terminée</span>
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    {result.category && (
                      <p>
                        <strong>Catégorie:</strong> {result.category}
                      </p>
                    )}
                    <p>
                      <strong>Priorité:</strong> {result.urgency}
                    </p>
                    <p>
                      <strong>Échéance:</strong> {result.deadline}
                    </p>
                    <p>
                      <strong>Étape proposée:</strong> {result.nextStep}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={simulateEmail}
                disabled={sending}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                suppressHydrationWarning
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Simulation en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Simuler localement
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Templates d'emails
            </h3>
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
              <h4 className="font-semibold text-blue-900 dark:text-white text-sm mb-2">
                💡 Conseils
              </h4>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Utilisez uniquement des données fictives</li>
                <li>• La simulation ne vérifie pas les faits ni les documents</li>
                <li>• Aucune date ou échéance juridique n’est calculée</li>
                <li>• Le message reste dans l’interface de démonstration</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <DemoStepCTA
            nextHref="/demo/workspace-reasoning"
            nextLabel="Étape suivante: Raisonnement"
          />
        </div>
      </div>
    </div>
  );
}
