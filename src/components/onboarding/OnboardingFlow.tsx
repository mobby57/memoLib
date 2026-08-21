'use client';

import { useState, useCallback } from 'react';
import { CheckCircle, ArrowRight, ArrowLeft, UserPlus, Mail, FolderPlus, Sparkles, Loader2 } from 'lucide-react';

interface OnboardingSteps {
  accountCreated: boolean;
  firstClient: boolean;
  firstEmail: boolean;
  firstDossier: boolean;
}

interface Props {
  steps: OnboardingSteps;
  userName?: string;
  tenantId?: string;
  onComplete: () => void;
  onDismiss: () => void;
}

type FlowStep = 'client' | 'email' | 'dossier' | 'done';

/**
 * OnboardingFlow — Parcours guidé inline
 * 
 * Contrairement à l'ancien OnboardingWizard (liens vers d'autres pages),
 * ce composant intègre les formulaires directement. L'utilisateur fait
 * tout sans quitter le dashboard.
 */
export function OnboardingFlow({ steps, userName, tenantId, onComplete, onDismiss }: Props) {
  // Déterminer l'étape initiale selon ce qui est déjà fait
  const getInitialStep = (): FlowStep => {
    if (!steps.firstClient) return 'client';
    if (!steps.firstEmail) return 'email';
    if (!steps.firstDossier) return 'dossier';
    return 'done';
  };

  const [currentStep, setCurrentStep] = useState<FlowStep>(getInitialStep());
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  const [createdEmailId, setCreatedEmailId] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [dossierCreated, setDossierCreated] = useState<{ numero: string; id: string } | null>(null);

  const completedSteps = [
    steps.accountCreated,
    steps.firstClient || currentStep !== 'client',
    steps.firstEmail || (currentStep !== 'client' && currentStep !== 'email'),
    steps.firstDossier || currentStep === 'done',
  ].filter(Boolean).length;

  const progress = (completedSteps / 4) * 100;

  // --- STEP 1: Créer un client ---
  const handleCreateClient = useCallback(async () => {
    if (!clientName.trim()) { setError('Entrez le nom du client'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: clientName.trim(), email: clientEmail.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur création client');
      }
      const data = await res.json();
      setCreatedClientId(data.id || data.client?.id);
      setCurrentStep('email');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [clientName, clientEmail]);

  // --- STEP 2: Coller un email ---
  const handleProcessEmail = useCallback(async () => {
    if (!emailBody.trim()) { setError('Collez le contenu d\'un email'); return; }
    setLoading(true);
    setError('');
    try {
      // D'abord, enregistrer l'email
      const emailRes = await fetch('/api/emails/paste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailSubject || '(sans objet)',
          body: emailBody,
          from: clientEmail || clientName || 'client@example.com',
        }),
      });
      
      let emailId: string | null = null;
      if (emailRes.ok) {
        const emailData = await emailRes.json();
        emailId = emailData.id || emailData.emailId;
        setCreatedEmailId(emailId);
      }

      // Ensuite, analyser avec l'IA
      const aiRes = await fetch('/api/ai/summarize-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailSubject || '(sans objet)',
          body: emailBody,
          from: clientEmail || clientName || 'client@example.com',
        }),
      });

      if (aiRes.ok) {
        const summary = await aiRes.json();
        setAiSummary(summary);
      }

      setCurrentStep('dossier');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [emailSubject, emailBody, clientEmail, clientName]);

  // --- STEP 3: Créer un dossier depuis l'email ---
  const handleCreateDossier = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/emails/create-dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId: createdEmailId,
          summary: aiSummary || {
            client: clientName,
            objet: emailSubject || 'Nouveau dossier',
            urgence: 'moyenne',
            typeDossier: 'GENERAL',
            resumeCourt: emailBody?.slice(0, 200),
          },
        }),
      });

      if (!res.ok) throw new Error('Erreur création dossier');
      const data = await res.json();
      setDossierCreated({ numero: data.numero, id: data.dossierId });
      setCurrentStep('done');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [createdEmailId, aiSummary, clientName, emailSubject, emailBody]);

  // --- STEP DONE ---
  if (currentStep === 'done') {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 mb-6">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-green-900 mb-2">Votre cabinet est opérationnel !</h2>
          <p className="text-green-700 text-sm mb-4">
            {dossierCreated
              ? `Dossier ${dossierCreated.numero} créé avec succès. MemoLib va maintenant suivre les échéances et vous alerter automatiquement.`
              : 'Tout est configuré. Votre espace de travail est prêt.'
            }
          </p>
          <div className="flex justify-center gap-3">
            {dossierCreated && (
              <a
                href={`/fr/dossiers/${dossierCreated.id}`}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
              >
                Voir le dossier
              </a>
            )}
            <button
              onClick={onComplete}
              className="px-4 py-2 bg-white text-green-700 border border-green-300 rounded-lg hover:bg-green-50 text-sm font-medium transition-colors"
            >
              Continuer vers le dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {userName ? `${userName}, configurez votre cabinet` : 'Configurez votre cabinet'}
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              3 étapes rapides — environ 2 minutes
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-blue-200 hover:text-white text-xs underline"
          >
            Plus tard
          </button>
        </div>
        {/* Progress */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 bg-blue-400/30 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-blue-100 font-medium">{completedSteps}/4</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* STEP: Client */}
        {currentStep === 'client' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Étape 1 — Votre premier client</h3>
                <p className="text-xs text-gray-500">Entrez le nom d'un client existant ou fictif pour tester</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du client *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: M. Dupont"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateClient()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (optionnel)</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="dupont@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateClient()}
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => { setCurrentStep('email'); }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Passer cette étape
              </button>
              <button
                onClick={handleCreateClient}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Créer et continuer
              </button>
            </div>
          </div>
        )}

        {/* STEP: Email */}
        {currentStep === 'email' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Mail className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Étape 2 — Collez un email</h3>
                <p className="text-xs text-gray-500">Copiez-collez un email client. L'IA va détecter l'urgence, le type de dossier et les échéances.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Objet</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Ex: Demande urgente titre de séjour"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenu de l'email *</label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder={"Collez ici le contenu d'un email reçu d'un client...\n\nExemple :\n\"Maître, j'ai reçu une OQTF le 15 janvier 2025. J'ai 30 jours pour faire un recours. Pouvez-vous m'aider en urgence ?\""}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                autoFocus
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setCurrentStep('client')}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Retour
              </button>
              <button
                onClick={handleProcessEmail}
                disabled={loading || !emailBody.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Analyser avec l'IA
              </button>
            </div>
          </div>
        )}

        {/* STEP: Dossier (le wow moment) */}
        {currentStep === 'dossier' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <FolderPlus className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Étape 3 — Créer le dossier</h3>
                <p className="text-xs text-gray-500">L'IA a analysé l'email. Créez le dossier en 1 clic.</p>
              </div>
            </div>

            {/* AI Summary Display */}
            {aiSummary && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Analyse IA</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Client :</span>{' '}
                    <span className="font-medium text-gray-900">{aiSummary.client || clientName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Urgence :</span>{' '}
                    <span className={`font-medium ${
                      aiSummary.urgence === 'critique' ? 'text-red-600' :
                      aiSummary.urgence === 'haute' ? 'text-orange-600' :
                      'text-gray-900'
                    }`}>
                      {aiSummary.urgence || 'moyenne'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Type :</span>{' '}
                    <span className="font-medium text-gray-900">{aiSummary.typeDossier?.replace('_', ' ') || 'GENERAL'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Deadline :</span>{' '}
                    <span className="font-medium text-gray-900">{aiSummary.deadlineDetectee || 'aucune'}</span>
                  </div>
                </div>
                {aiSummary.resumeCourt && (
                  <p className="text-sm text-gray-700 mt-2 italic">"{aiSummary.resumeCourt}"</p>
                )}
                {aiSummary._fallback && (
                  <p className="text-xs text-blue-500 mt-1">⚡ Analyse rapide (IA locale indisponible)</p>
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setCurrentStep('email')}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Modifier l'email
              </button>
              <button
                onClick={handleCreateDossier}
                disabled={loading}
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-green-200"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
                Créer le dossier en 1 clic
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Step indicators */}
      <div className="border-t border-gray-100 px-6 py-3 bg-gray-50 flex items-center justify-center gap-2">
        {(['client', 'email', 'dossier'] as FlowStep[]).map((step, i) => (
          <div
            key={step}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              currentStep === step
                ? 'bg-blue-600'
                : i < ['client', 'email', 'dossier'].indexOf(currentStep)
                  ? 'bg-green-500'
                  : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
