'use client';

import { useState } from 'react';
import { Mail, FolderPlus, FileText, Clock, Brain, CheckCircle, ArrowRight, Play, Shield } from 'lucide-react';

// ─── Données de démo réalistes (CESEDA) ────────────────────────────────────

const DEMO_EMAIL = {
  from: 'Mehdi Belkacem <m.belkacem@gmail.com>',
  subject: 'URGENT - OQTF reçue hier',
  date: new Date().toLocaleDateString('fr-FR'),
  body: `Maître,

Je viens de recevoir une OQTF avec délai de départ volontaire de 30 jours, notifiée hier par courrier recommandé.

Je suis en France depuis 4 ans, j'ai un CDI dans le BTP depuis 2 ans et mes 2 enfants sont scolarisés à Montreuil.

Ma femme a un titre de séjour vie privée et familiale valide jusqu'en 2027.

Pouvez-vous m'aider à faire un recours ?

Cordialement,
Mehdi Belkacem
06 12 34 56 78`,
};

const DEMO_AI_SUMMARY = {
  client: 'Mehdi Belkacem',
  typeDossier: 'OQTF',
  urgence: 'haute' as const,
  objet: 'OQTF avec délai 30 jours — recours à exercer',
  deadlineDetectee: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
  resumeCourt: 'Client en France depuis 4 ans, CDI BTP, 2 enfants scolarisés, épouse titre VS VPF. OQTF avec délai notifiée hier. Recours TA dans 30 jours.',
  articlesApplicables: ['L612-1 CESEDA', 'L612-2 (protection)', 'Art. 8 CEDH (vie privée/familiale)'],
  forcesDetectees: [
    'Ancienneté de séjour : 4 ans',
    'Insertion professionnelle : CDI stable 2 ans',
    'Attaches familiales : épouse en situation régulière + enfants scolarisés',
    'Art. 8 CEDH applicable (proportionnalité)',
  ],
};

const DEMO_DOSSIER = {
  numero: 'DOS-2026-0042',
  type: 'Recours OQTF (L612-1 CESEDA)',
  deadline: '29 jours restants',
  statut: 'En cours',
  checklist: [
    { label: 'Copie OQTF + AR', done: false },
    { label: 'Pièce d\'identité', done: false },
    { label: 'Justificatifs résidence 4 ans', done: false },
    { label: 'Contrat de travail CDI', done: false },
    { label: 'Bulletins de salaire (12 mois)', done: false },
    { label: 'Certificats de scolarité enfants', done: false },
    { label: 'Titre de séjour épouse (copie)', done: false },
    { label: 'Requête introductive TA', done: false },
  ],
};

const DEMO_DOCUMENT = `TRIBUNAL ADMINISTRATIF DE MONTREUIL

REQUÊTE EN ANNULATION

Requérant : M. [CLIENT]
Objet : Annulation de l'OQTF du [DATE]
Référence : ${DEMO_DOSSIER.numero}

DISCUSSION :

Sur le moyen tiré de la violation de l'article 8 de la CEDH :

Le requérant justifie d'une résidence habituelle en France depuis 4 années, d'une insertion professionnelle stable (CDI depuis 2 ans), et d'attaches familiales fortes (épouse titulaire d'un titre VPF, deux enfants scolarisés).

La mesure d'éloignement porte une atteinte disproportionnée au droit au respect de sa vie privée et familiale au sens de l'article 8 de la Convention européenne...`;

// ─── Composant principal ───────────────────────────────────────────────────

type Step = 'intro' | 'email' | 'ai' | 'dossier' | 'document' | 'done';

export default function DemoAvocatPage() {
  const [step, setStep] = useState<Step>('intro');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const simulateAI = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setStep('ai');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-semibold">MemoLib</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2">Démo interactive</span>
        </div>
        <a href="/fr/signup" className="text-sm text-blue-600 font-medium hover:underline">
          Créer mon cabinet →
        </a>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* ─── INTRO ─── */}
        {step === 'intro' && (
          <div className="text-center py-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Voyez MemoLib en action
            </h1>
            <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
              Scénario réel : un client vous envoie un email urgent suite à une OQTF.
              Découvrez comment MemoLib vous fait gagner 45 minutes.
            </p>
            <button
              onClick={() => setStep('email')}
              className="inline-flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-600/25"
            >
              <Play className="w-6 h-6" />
              Démarrer la démo (3 min)
            </button>
            <div className="mt-8 flex justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> Email reçu</span>
              <span>→</span>
              <span className="flex items-center gap-1"><Brain className="w-4 h-4" /> IA analyse</span>
              <span>→</span>
              <span className="flex items-center gap-1"><FolderPlus className="w-4 h-4" /> Dossier créé</span>
              <span>→</span>
              <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> Document généré</span>
            </div>
          </div>
        )}

        {/* ─── STEP 1: EMAIL REÇU ─── */}
        {step === 'email' && (
          <div className="space-y-6">
            <StepHeader step={1} title="Un email urgent arrive" subtitle="Le client vous contacte pour une OQTF" />
            
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{DEMO_EMAIL.from}</p>
                  <p className="text-sm text-gray-500">{DEMO_EMAIL.subject}</p>
                </div>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">URGENT</span>
              </div>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{DEMO_EMAIL.body}</pre>
            </div>

            <div className="text-center">
              <p className="text-gray-500 mb-4">Normalement : 10 min de tri, saisie manuelle, calcul de délai...</p>
              <button
                onClick={simulateAI}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    L&apos;IA analyse l&apos;email...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    Avec MemoLib : 1 clic → IA analyse
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 2: IA ANALYSE ─── */}
        {step === 'ai' && (
          <div className="space-y-6">
            <StepHeader step={2} title="L'IA a analysé en 2 secondes" subtitle="Classification, urgence, deadline, forces juridiques" />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border p-5 space-y-3">
                <h3 className="font-semibold text-gray-900">📋 Résumé structuré</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Client</span><span className="font-medium">{DEMO_AI_SUMMARY.client}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium text-red-600">{DEMO_AI_SUMMARY.typeDossier}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Urgence</span><span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">{DEMO_AI_SUMMARY.urgence}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Deadline recours</span><span className="font-medium text-orange-600">{DEMO_AI_SUMMARY.deadlineDetectee}</span></div>
                </div>
              </div>

              <div className="bg-white rounded-xl border p-5 space-y-3">
                <h3 className="font-semibold text-gray-900">⚖️ Articles applicables</h3>
                <ul className="space-y-1">
                  {DEMO_AI_SUMMARY.articlesApplicables.map(a => (
                    <li key={a} className="text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-green-50 rounded-xl border border-green-200 p-5 space-y-3 md:col-span-2">
                <h3 className="font-semibold text-green-800">💪 Forces détectées par l&apos;IA</h3>
                <ul className="grid md:grid-cols-2 gap-2">
                  {DEMO_AI_SUMMARY.forcesDetectees.map(f => (
                    <li key={f} className="text-sm flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="text-sm text-gray-400 text-center italic">
              🔒 Mode confidentiel disponible — aucune donnée vers le cloud si activé
            </p>

            <div className="text-center">
              <button
                onClick={() => setStep('dossier')}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                <FolderPlus className="w-5 h-5" />
                Créer le dossier en 1 clic
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: DOSSIER CRÉÉ ─── */}
        {step === 'dossier' && (
          <div className="space-y-6">
            <StepHeader step={3} title="Dossier créé automatiquement" subtitle="Numéro, type, deadline, checklist — tout est rempli" />

            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{DEMO_DOSSIER.numero}</h3>
                  <p className="text-sm text-gray-500">{DEMO_DOSSIER.type}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                    <Clock className="w-4 h-4" />
                    {DEMO_DOSSIER.deadline}
                  </span>
                  <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                    {DEMO_DOSSIER.statut}
                  </span>
                </div>
              </div>

              <h4 className="font-medium text-gray-700 mb-3">📋 Checklist documents (auto-générée)</h4>
              <div className="grid md:grid-cols-2 gap-2">
                {DEMO_DOSSIER.checklist.map(item => (
                  <label key={item.label} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked={item.done} />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Alertes automatiques programmées</p>
                <p className="text-sm text-amber-600">J-7, J-3, J-1 avant l&apos;échéance du recours. Par email + notification in-app.</p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setStep('document')}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                <FileText className="w-5 h-5" />
                Générer la requête TA
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 4: DOCUMENT GÉNÉRÉ ─── */}
        {step === 'document' && (
          <div className="space-y-6">
            <StepHeader step={4} title="Requête générée automatiquement" subtitle="Variables remplies, articles cités, argumentation structurée" />

            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">📄 Requête introductive — Tribunal Administratif</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Prêt à personnaliser</span>
              </div>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 p-4 rounded-lg border max-h-64 overflow-y-auto">{DEMO_DOCUMENT}</pre>
            </div>

            <div className="text-center">
              <button
                onClick={() => setStep('done')}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition"
              >
                <CheckCircle className="w-5 h-5" />
                Voir le résumé
              </button>
            </div>
          </div>
        )}

        {/* ─── DONE ─── */}
        {step === 'done' && (
          <div className="text-center py-12 space-y-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Tout ça en 45 secondes</h2>
            <p className="text-lg text-gray-500 max-w-lg mx-auto">
              Sans MemoLib : 45 minutes de tri, saisie, calcul, rédaction.<br />
              Avec MemoLib : <strong>1 clic</strong>.
            </p>

            <div className="grid md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
              {[
                { icon: Mail, label: 'Email classifié', detail: 'OQTF détectée automatiquement' },
                { icon: Clock, label: 'Deadline calculée', detail: '30j recours + alertes J-7/J-3/J-1' },
                { icon: FolderPlus, label: 'Dossier complet', detail: 'Checklist CESEDA auto-générée' },
                { icon: FileText, label: 'Requête prête', detail: 'Art. 8 CEDH argumenté' },
              ].map(item => (
                <div key={item.label} className="bg-white border rounded-xl p-4">
                  <item.icon className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <Shield className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-400">Chiffrement AES-256 • Hébergement France • Mode confidentiel disponible</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a
                href="/fr/signup"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-700 transition text-lg shadow-lg shadow-blue-600/25"
              >
                Créer mon cabinet — 14j gratuits
                <ArrowRight className="w-5 h-5" />
              </a>
              <button
                onClick={() => setStep('intro')}
                className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-600 px-6 py-4 rounded-xl font-medium hover:bg-gray-50 transition"
              >
                Revoir la démo
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Composant helper ─────────────────────────────────────────────────────

function StepHeader({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold">
        {step}
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="flex-1" />
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`w-8 h-1.5 rounded-full ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
        ))}
      </div>
    </div>
  );
}
