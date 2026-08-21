'use client';

import { useState } from 'react';
import { Mail, FolderPlus, FileText, Clock, Brain, CheckCircle, ArrowRight, Play, Shield, Globe, AlertTriangle, Scale } from 'lucide-react';

// ─── Données de démo : Scénario refus de titre de séjour (pertinent pour Me Boudhane) ───

const DEMO_EMAIL = {
  from: 'Fatima Ziane <fatima.ziane.57@outlook.fr>',
  subject: 'Refus titre de séjour — recours possible ?',
  date: new Date().toLocaleDateString('fr-FR'),
  body: `Bonjour Maître Boudhane,

J'ai reçu hier une décision de refus de renouvellement de mon titre de séjour « vie privée et familiale » avec OQTF 30 jours.

Je suis en France depuis 6 ans. J'ai 3 enfants scolarisés (14, 11 et 7 ans) nés en Algérie mais arrivés très jeunes. Mon ex-mari est français, je suis divorcée depuis 2 ans.

La préfecture dit que je n'ai pas de ressources suffisantes, mais je travaille en CDI comme aide-soignante depuis 1 an et demi.

On m'a dit que je pouvais faire un recours au tribunal. Est-ce que vous pouvez m'aider ? Je parle arabe si c'est plus facile pour expliquer.

Merci beaucoup,
Fatima Ziane
06 78 90 12 34`,
};

const DEMO_AI_SUMMARY = {
  client: 'Fatima Ziane',
  typeDossier: 'Refus renouvellement VPF + OQTF 30 jours',
  urgence: 'haute' as const,
  objet: 'Refus renouvellement titre VPF — OQTF 30 jours — recours TA',
  deadlineRecours: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
  resumeCourt: 'Divorcée d\'un Français, 3 enfants scolarisés, CDI aide-soignante 18 mois, en France 6 ans. Refus VPF pour insuffisance de ressources. OQTF 30 jours notifiée hier.',
  articlesApplicables: [
    'L423-23 CESEDA (parent d\'enfant scolarisé)',
    'L612-1 CESEDA (OQTF avec délai)',
    'Art. 8 CEDH (vie privée/familiale)',
    'Art. 3-1 CIDE (intérêt supérieur de l\'enfant)',
    'L435-1 CESEDA (admission exceptionnelle)',
  ],
  forcesDetectees: [
    '3 enfants scolarisés depuis plusieurs années en France',
    'Insertion professionnelle : CDI aide-soignante (métier en tension)',
    'Ex-épouse de Français — vie commune antérieure',
    'Ancienneté de séjour : 6 ans',
    'Erreur d\'appréciation des ressources (CDI stable)',
  ],
  langueDetectee: 'Français + Arabe disponible — communication bilingue possible',
};

const DEMO_DOSSIER = {
  numero: 'DOS-2026-0093',
  type: 'Recours TA — Refus VPF + OQTF 30 jours (L612-1 CESEDA)',
  deadline: '29 jours restants',
  statut: 'En cours — Urgent',
  checklist: [
    { label: 'Copie décision refus + OQTF + AR', done: false },
    { label: 'Ancien titre de séjour VPF (copie)', done: false },
    { label: 'Jugement de divorce', done: false },
    { label: 'Actes de naissance enfants + certificats scolarité', done: false },
    { label: 'Contrat CDI + bulletins de salaire (12 mois)', done: false },
    { label: 'Avis d\'imposition', done: false },
    { label: 'Justificatifs domicile (6 ans)', done: false },
    { label: 'Requête introductive TA de Metz', done: false },
    { label: 'Demande d\'aide juridictionnelle', done: false },
  ],
};

const DEMO_DOCUMENT = `TRIBUNAL ADMINISTRATIF DE METZ

REQUÊTE EN ANNULATION
(Article L612-1 CESEDA — délai 30 jours)

Requérante : Mme Fatima ZIANE
Domiciliée : [ADRESSE]
Représentée par : Me Saïda BOUDHANE, Avocat au Barreau de Metz
Cabinet : 1 place de Seille, 57000 Metz

Objet : Annulation du refus de renouvellement du titre de séjour VPF
        et de l'OQTF assortie du ${new Date().toLocaleDateString('fr-FR')}
Référence : ${DEMO_DOSSIER.numero}

DISCUSSION :

I. Sur l'erreur d'appréciation des conditions de ressources

La requérante justifie d'un CDI en qualité d'aide-soignante depuis 18 mois, métier inscrit sur la liste des métiers en tension (arrêté du 1er avril 2021). Ses revenus permettent de subvenir aux besoins de sa famille sans recours aux prestations sociales à titre principal.

II. Sur la violation de l'article 8 de la CEDH

Mme ZIANE réside en France depuis 6 ans. Ses trois enfants (14, 11 et 7 ans) y sont scolarisés et y ont développé l'essentiel de leurs attaches sociales et affectives. L'éloignement de la requérante porterait une atteinte disproportionnée au droit au respect de sa vie privée et familiale.

III. Sur la méconnaissance de l'article 3-1 de la CIDE

L'intérêt supérieur des trois enfants mineurs commande leur maintien dans leur environnement scolaire et social en France, auprès de leur mère...

PAR CES MOTIFS, il est demandé au Tribunal d'annuler les décisions attaquées et d'enjoindre au Préfet de délivrer un titre de séjour dans un délai d'un mois.`;

// ─── Composant principal ───────────────────────────────────────────────────

type Step = 'intro' | 'email' | 'ai' | 'dossier' | 'document' | 'done';

export default function DemoBoudhanePage() {
  const [step, setStep] = useState<Step>('intro');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const simulateAI = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setStep('ai');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header personnalisé */}
      <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-semibold">MemoLib</span>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full ml-2">
            Démo · Cabinet Boudhane
          </span>
        </div>
        <a href="/fr/signup" className="text-sm text-blue-600 font-medium hover:underline">
          Essai gratuit 14 jours →
        </a>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* ─── INTRO ─── */}
        {step === 'intro' && (
          <div className="text-center py-12 space-y-8">
            <div className="inline-block">
              <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                Préparé pour Me Saïda Boudhane — Barreau de Metz
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Gérez vos dossiers étrangers <span className="text-blue-600">10x plus vite</span>
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Scénario réel : une cliente reçoit un <strong>refus de titre de séjour + OQTF</strong>.
              Voyez comment MemoLib automatise l&apos;analyse, le dossier et la requête.
            </p>

            {/* Points spécifiques au cabinet */}
            <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
              <div className="bg-white border rounded-xl p-4">
                <Globe className="w-5 h-5 text-blue-600 mb-2" />
                <p className="font-medium text-sm">Arabe + Anglais + Français</p>
                <p className="text-xs text-gray-500">L&apos;IA comprend les emails en arabe et résume en français</p>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <Scale className="w-5 h-5 text-blue-600 mb-2" />
                <p className="font-medium text-sm">281+ contentieux référencés</p>
                <p className="text-xs text-gray-500">Droit des étrangers, droit public, droit processuel</p>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <Clock className="w-5 h-5 text-red-500 mb-2" />
                <p className="font-medium text-sm">Délais critiques</p>
                <p className="text-xs text-gray-500">30 jours recours OQTF, 48h rétention — alertes automatiques</p>
              </div>
            </div>

            <button
              onClick={() => setStep('email')}
              className="inline-flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-600/25"
            >
              <Play className="w-6 h-6" />
              Lancer la démo (3 min)
            </button>

            <div className="flex justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> Email reçu</span>
              <span>→</span>
              <span className="flex items-center gap-1"><Brain className="w-4 h-4" /> IA analyse</span>
              <span>→</span>
              <span className="flex items-center gap-1"><FolderPlus className="w-4 h-4" /> Dossier + checklist</span>
              <span>→</span>
              <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> Requête TA générée</span>
            </div>
          </div>
        )}

        {/* ─── STEP 1: EMAIL REÇU ─── */}
        {step === 'email' && (
          <div className="space-y-6">
            <StepHeader step={1} title="Email reçu d'une cliente" subtitle="Refus de renouvellement VPF + OQTF 30 jours" />
            
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{DEMO_EMAIL.from}</p>
                  <p className="text-sm text-gray-500">{DEMO_EMAIL.subject}</p>
                </div>
                <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  URGENT
                </span>
              </div>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{DEMO_EMAIL.body}</pre>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 flex items-start gap-2">
              <Globe className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>La cliente mentionne qu&apos;elle parle arabe — MemoLib détecte et propose la communication bilingue.</span>
            </div>

            <div className="text-center">
              <p className="text-gray-500 mb-4">Sans MemoLib : lire, identifier les articles, calculer le délai, créer le dossier à la main...</p>
              <button
                onClick={simulateAI}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    L&apos;IA analyse (CESEDA + CEDH + CIDE)...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    Analyse IA en 1 clic
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 2: IA ANALYSE ─── */}
        {step === 'ai' && (
          <div className="space-y-6">
            <StepHeader step={2} title="Analyse IA complète en 3 secondes" subtitle="Type de dossier, urgence, deadline, forces juridiques identifiées" />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border p-5 space-y-3">
                <h3 className="font-semibold text-gray-900">📋 Résumé structuré</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Client</span><span className="font-medium">{DEMO_AI_SUMMARY.client}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium text-orange-600">{DEMO_AI_SUMMARY.typeDossier}</span></div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Urgence</span>
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-bold">{DEMO_AI_SUMMARY.urgence}</span>
                  </div>
                  <div className="flex justify-between"><span className="text-gray-500">Deadline recours TA</span><span className="font-bold text-orange-600">{DEMO_AI_SUMMARY.deadlineRecours}</span></div>
                </div>
              </div>

              <div className="bg-white rounded-xl border p-5 space-y-3">
                <h3 className="font-semibold text-gray-900">⚖️ Articles applicables</h3>
                <ul className="space-y-1.5">
                  {DEMO_AI_SUMMARY.articlesApplicables.map(a => (
                    <li key={a} className="text-sm flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
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

              {/* Détection langue */}
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 md:col-span-2 flex items-center gap-3">
                <Globe className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">{DEMO_AI_SUMMARY.langueDetectee}</p>
                  <p className="text-xs text-blue-600">Vous pouvez répondre en arabe — MemoLib gère la communication multilingue</p>
                </div>
              </div>
            </div>

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
            <StepHeader step={3} title="Dossier créé automatiquement" subtitle="Numéro, type, deadline 30 jours, checklist pièces complète" />

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
                  <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                    {DEMO_DOSSIER.statut}
                  </span>
                </div>
              </div>

              <h4 className="font-medium text-gray-700 mb-3">📋 Checklist pièces (auto-générée pour refus VPF)</h4>
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
                <p className="text-sm text-amber-600">
                  J-7, J-3, J-1 avant l&apos;échéance du recours TA. Par email + notification in-app.
                </p>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
              <Scale className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-purple-800">Aide juridictionnelle détectée</p>
                <p className="text-sm text-purple-600">
                  Profil éligible AJ — formulaire Cerfa 16146 pré-rempli avec les infos du dossier.
                </p>
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
            <StepHeader step={4} title="Requête TA générée" subtitle="Tribunal Administratif de Metz — recours OQTF 30 jours" />

            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">📄 Requête en annulation — TA de Metz</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Prêt à personnaliser</span>
              </div>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 p-4 rounded-lg border max-h-72 overflow-y-auto">{DEMO_DOCUMENT}</pre>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-gray-50 border rounded-lg p-3 text-sm">
                <p className="font-medium text-gray-700 mb-1">📝 Personnalisation</p>
                <p className="text-gray-500">Éditez directement, ajoutez votre argumentation spécifique, exportez en PDF/Word.</p>
              </div>
              <div className="bg-gray-50 border rounded-lg p-3 text-sm">
                <p className="font-medium text-gray-700 mb-1">🔍 Jurisprudence TA Metz</p>
                <p className="text-gray-500">Recherche automatique des décisions récentes TA Metz + CAA Nancy sur refus VPF.</p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setStep('done')}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition"
              >
                <CheckCircle className="w-5 h-5" />
                Voir le bilan
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
            <h2 className="text-3xl font-bold text-gray-900">
              1h30 gagnée sur ce dossier
            </h2>
            <p className="text-lg text-gray-500 max-w-lg mx-auto">
              <span className="line-through text-red-400">1h30+ (lecture, recherche CESEDA, rédaction requête, saisie dossier)</span><br />
              <span className="text-green-600 font-medium">3 minutes (1 clic + relecture et personnalisation)</span>
            </p>

            <div className="grid md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
              {[
                { icon: Mail, label: 'Email classifié', detail: 'Refus VPF + OQTF détectés' },
                { icon: Clock, label: 'Deadline 30j', detail: 'Alertes J-7, J-3, J-1' },
                { icon: FolderPlus, label: 'Dossier complet', detail: 'Checklist + AJ pré-remplie' },
                { icon: FileText, label: 'Requête TA prête', detail: 'Art. 8 CEDH + CIDE + L423-23' },
              ].map(item => (
                <div key={item.label} className="bg-white border rounded-xl p-4">
                  <item.icon className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.detail}</p>
                </div>
              ))}
            </div>

            {/* Spécificités cabinet */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border rounded-xl p-6 max-w-2xl mx-auto text-left space-y-3">
              <h3 className="font-semibold text-gray-900">Ce que MemoLib apporte à votre pratique</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> <strong>Droit des étrangers :</strong> classification auto (OQTF, titre séjour, asile, naturalisation, rétention)</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> <strong>Arabe + Anglais :</strong> comprend vos clients dans leur langue, résume en français</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> <strong>Volume de dossiers :</strong> 281+ contentieux = beaucoup de suivi → MemoLib gère les deadlines</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> <strong>Droit public :</strong> templates recours gracieux, recours contentieux, référé-liberté</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> <strong>Aide juridictionnelle :</strong> détection automatique de l&apos;éligibilité, Cerfa pré-rempli</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> <strong>RGPD natif :</strong> données hébergées en France, chiffrement, secret professionnel</li>
              </ul>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Shield className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-400">Chiffrement AES-256 • Hébergement France • Conforme RGPD • Secret professionnel respecté</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a
                href="/fr/signup?plan=SOLO&cabinet=Cabinet+Boudhane&source=demo"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-700 transition text-lg shadow-lg shadow-blue-600/25"
              >
                S&apos;inscrire et connecter ma boîte mail
                <ArrowRight className="w-5 h-5" />
              </a>
              <button
                onClick={() => setStep('intro')}
                className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-600 px-6 py-4 rounded-xl font-medium hover:bg-gray-50 transition"
              >
                Revoir la démo
              </button>
            </div>

            {/* Étapes post-inscription */}
            <div className="bg-gray-50 border rounded-xl p-5 max-w-md mx-auto text-left">
              <p className="font-medium text-gray-800 mb-3">Après inscription (2 min) :</p>
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  Connectez votre boîte Gmail ou Outlook
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  L&apos;IA analyse vos vrais emails
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  Créez votre premier dossier en 1 clic
                </li>
              </ol>
            </div>

            {/* CTA contact */}
            <div className="pt-6 border-t max-w-md mx-auto">
              <p className="text-sm text-gray-500 mb-2">Des questions ? Je vous accompagne personnellement.</p>
              <p className="text-sm text-gray-700 font-medium">
                📧 contact@memolib.fr · 📞 Sur rendez-vous
              </p>
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
