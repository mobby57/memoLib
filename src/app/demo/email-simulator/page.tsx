'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Mail, Send, CheckCircle, Loader2, AlertCircle, User, Building } from 'lucide-react';

const TEST_CLIENTS = [
  { email: 'mohamed.benali@example.com', name: 'Mohamed Benali' },
  { email: 'karim.ibrahim@example.com', name: 'Karim Ibrahim' },
  { email: 'nouveau.client@example.com', name: 'Nouveau Client (non enregistre)' }
];

const TEST_LAWYERS = [
  { email: 'jean.dupont@cabinet-dupont.fr', name: 'Maitre Jean Dupont' },
  { email: 'sophie.martin@cabinet-martin.fr', name: 'Maitre Sophie Martin' },
  { email: 'pierre.rousseau@cabinet-rousseau.fr', name: 'Maitre Pierre Rousseau' }
];

const EMAIL_TEMPLATES = [
  {
    name: 'Question juridique urgente',
    subject: 'URGENT - Question concernant mon dossier de regularisation',
    body: `Bonjour Maitre,

Je vous ecris car j'ai une situation urgente concernant mon dossier de regularisation.

J'ai recu hier une convocation de la prefecture pour un entretien le 15 fevrier prochain. Je suis tres inquiet car je ne sais pas quels documents je dois apporter.

Pouvez-vous me rappeler des que possible pour me conseiller sur la marche a suivre ?

Merci pour votre aide.

Cordialement,
Mohamed Benali
Tel: 06 12 34 56 78`
  },
  {
    name: 'Demande de rendez-vous',
    subject: 'Demande de rendez-vous pour consultation',
    body: `Bonjour Maitre,

Je souhaiterais prendre rendez-vous pour une consultation concernant ma demande de titre de sejour.

Je suis disponible les matins en semaine. Quelles sont vos disponibilites ?

Merci d'avance.

Cordialement`
  },
  {
    name: 'Envoi de documents',
    subject: 'Documents demandes pour mon dossier',
    body: `Bonjour Maitre,

Suite a notre dernier echange, veuillez trouver ci-joint les documents suivants :
- Copie de mon passeport
- Justificatifs de domicile des 3 derniers mois
- Attestation d'hebergement

N'hesitez pas a me contacter si vous avez besoin d'autres pieces.

Bien cordialement`
  },
  {
    name: 'Reclamation',
    subject: 'Insatisfaction concernant le suivi de mon dossier',
    body: `Bonjour,

Je me permets de vous ecrire car je suis mecontent du suivi de mon dossier.

Cela fait maintenant 3 semaines que j'attends un retour concernant ma demande et je n'ai recu aucune nouvelle malgre mes relances telephoniques.

Je souhaite obtenir des explications sur ce retard et connaitre l'etat d'avancement de mon dossier.

Dans l'attente de votre reponse.`
  }
];

export default function EmailSimulatorPage() {
  const [fromEmail, setFromEmail] = useState(TEST_CLIENTS[0].email);
  const [toEmail, setToEmail] = useState(TEST_LAWYERS[0].email);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const applyTemplate = (template: typeof EMAIL_TEMPLATES[0]) => {
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
      const response = await fetch('/api/emails/incoming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromEmail,
          to: toEmail,
          subject,
          body,
          messageId: `test-${Date.now()}@simulator.local`
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Erreur lors de l\'envoi');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
            <Mail className="w-8 h-8 text-blue-600" />
            Simulateur d'Email Client
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Testez le flux complet de traitement des emails entrants
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email Form */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Send className="w-5 h-5" />
              Composer un email
            </h2>

            <div className="space-y-4">
              {/* From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  De (Client)
                </label>
                <select
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {TEST_CLIENTS.map((client) => (
                    <option key={client.email} value={client.email}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Building className="w-4 h-4 inline mr-1" />
                  a (Avocat)
                </label>
                <select
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {TEST_LAWYERS.map((lawyer) => (
                    <option key={lawyer.email} value={lawyer.email}>
                      {lawyer.name} ({lawyer.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sujet
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Sujet de l'email..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Contenu de l'email..."
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              {/* Result */}
              {result && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Email envoye avec succes!</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-300 space-y-1">
                    <p><strong>Email ID:</strong> {result.emailId}</p>
                    <p><strong>Workflow ID:</strong> {result.workflowId}</p>
                    <p><strong>Categorie detectee:</strong> {result.category}</p>
                    <p><strong>Urgence:</strong> {result.urgency}</p>
                  </div>
                  <a 
                    href="/super-admin/emails"
                    className="inline-block mt-3 text-sm text-green-700 dark:text-green-400 underline hover:no-underline"
                  >
                    [Next] Voir dans le dashboard Super Admin
                  </a>
                </div>
              )}

              {/* Send Button */}
              <button
                onClick={sendEmail}
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition"
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

          {/* Templates */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Modeles d'email
            </h2>
            <div className="space-y-3">
              {EMAIL_TEMPLATES.map((template, index) => (
                <button
                  key={index}
                  onClick={() => applyTemplate(template)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {template.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                    {template.subject}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Comptes de test
              </h3>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-2">
                <p><strong>Super Admin:</strong><br />superadmin@iapostemanager.com</p>
                <p><strong>Avocat:</strong><br />jean.dupont@cabinet-dupont.fr</p>
                <p><strong>Client:</strong><br />mohamed.benali@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
