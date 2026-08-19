'use client';

import { useState } from 'react';
import { Mail, FolderPlus, FileText, Clock, Brain, CheckCircle, ArrowRight, Play, Shield, Globe, AlertTriangle, Users } from 'lucide-react';

// ─── Données de démo : Scénario CRA Metz (pertinent pour Me Blanvillain) ───

const DEMO_EMAIL = {
  from: 'Amina Khoury <amina.khoury.92@gmail.com>',
  subject: 'Mon mari retenu au CRA de Metz — urgence',
  date: new Date().toLocaleDateString('fr-FR'),
  body: `Maître Blanvillain,

Mon mari Karim a été interpellé ce matin et placé au centre de rétention de Metz.

Il a reçu un arrêté de placement en rétention + une OQTF sans délai.

Nous sommes mariés depuis 3 ans, nous avons une fille de 18 mois née en France. Mon mari travaillait en intérim depuis 1 an (BTP).

Son passeport algérien est au commissariat. Le juge des libertés et de la détention doit statuer dans 48h.

Je ne parle pas très bien français, pouvez-vous m'aider ?

Merci,
Amina Khoury
07 65 43 21 09`,
};

const DEMO_AI_SUMMARY = {
  client: 'Karim Khoury (via épouse Amina)',
  typeDossier: 'Rétention + OQTF sans délai',
  urgence: 'critique' as const,
  objet: 'Placement CRA Metz — JLD 48h — OQTF sans délai à contester',
  deadlineJLD: '48h (audience JLD)',
  deadlineRecours: '48h (recours TA contre OQTF sans délai)',
  resumeCourt: 'Client algérien, marié 3 ans à résidente régulière, fille française 18 mois, intérim BTP 1 an. Placé CRA Metz ce jour. Double urgence : JLD 48h + recours OQTF sans délai 48h.',
  articlesApplicables: [
    'L741-1 CESEDA (placement en rétention)',
    'L742-4 (contrôle JLD 48h)',
    'L614-6 (recours OQTF sans délai — 48h)',
    'Art. 8 CEDH (vie privée/familiale)',
    'Art. 3-1 CIDE (intérêt supérieur de l\'enfant)',
  ],
  forcesDetectees: [
    'Mariage de 3 ans avec résidente régulière',
    'Enfant français de 18 mois (protection CIDE)',
    'Insertion professionnelle (intérim régulier)',
    'Art. 8 CEDH : vie familiale effective',
    'Irrégularité potentielle de la procédure d\'interpellation',
  ],
  langueDetectee: 'Français (niveau intermédiaire) — possibilité de communication en arabe',
};

const DEMO_DOSSIER = {
  numero: 'DOS-2026-0087',
  type: 'Rétention CRA + OQTF sans délai (L614-6 CESEDA)',
  deadline: '⚡ 48h — URGENT',
  statut: 'Urgence absolue',
  checklist: [
    { label: 'Copie OQTF sans délai + arrêté rétention', done: false },
    { label: 'PV d\'interpellation (vérif. régularité)', done: false },
    { label: 'Acte de mariage + titre séjour épouse', done: false },
    { label: 'Acte de naissance fille (née en France)', done: false },
    { label: 'Justificatifs emploi intérim (contrats + bulletins)', done: false },
    { label: 'Justificatif domicile commun', done: false },
    { label: 'Requête JLD (contestation rétention)', done: false },
    { label: 'Requête TA (annulation OQTF sans délai)', done: false },
  ],
};

const DEMO_DOCUMENT = `TRIBUNAL ADMINISTRATIF DE METZ

REQUÊTE EN ANNULATION — PROCÉDURE D'URGENCE (48 heures)
(Article L614-6 CESEDA)

Requérant : M. Karim KHOURY
Actuellement retenu au CRA de Metz-Queuleu
Représenté par : Me Émilie BLANVILLAIN, Avocat au Barreau de Metz
Cabinet : 10 rue Fabert, 57000 Metz

Objet : Annulation de l'OQTF sans délai du ${new Date().toLocaleDateString('fr-FR')}
Référence : ${DEMO_DOSSIER.numero}

DISCUSSION :

I. Sur la violation de l'article 8 de la CEDH

Le requérant est marié depuis 3 ans avec Mme Amina KHOURY, titulaire d'un titre de séjour en cours de validité. Le couple a une fille de 18 mois, née en France.

La mesure d'éloignement porte une atteinte manifestement disproportionnée au droit au respect de la vie privée et familiale.

II. Sur la méconnaissance de l'article 3-1 de la CIDE

L'intérêt supérieur de l'enfant, de nationalité française, commande le maintien de son père sur le territoire...

III. Sur l'irrégularité de la procédure d'interpellation

[À compléter après examen du PV — vérification des conditions de contrôle d'identité]

PAR CES MOTIFS, il est demandé au Tribunal d'annuler la décision attaquée.`;

// ─── Métriques de gain de temps ────────────────────────────────────────────

const TIME_SAVED = {
  without: '2h+ (recherche articles, rédaction requête, calcul délais, saisie dossier)',
  with: '3 minutes (1 clic + relecture personnalisation)',
};

// ─── Composant principal ───────────────────────────────────────────────────

type Step = 'intro' | 'email' | 'ai' | 'dossier' | 'document' | 'done';

export default function DemoBlanvillainPage() {
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
            Démo · Cabinet Blanvillain
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
                Préparé pour Me Émilie Blanvillain — Barreau de Metz
              </span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Votre cabinet, <span className="text-blue-600">boosté par l&apos;IA</span>
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Scénario réel : un client est placé au <strong>CRA de Metz</strong>.
              Son épouse vous contacte en urgence.
              Voyez comment MemoLib vous fait gagner 2 heures.
            </p>

            {/* Points spécifiques au cabinet */}
            <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
              <div className="bg-white border rounded-xl p-4">
                <Globe className="w-5 h-5 text-blue-600 mb-2" />
                <p className="font-medium text-sm">Multi-langue</p>
                <p className="text-xs text-gray-500">Détecte arabe, anglais, espagnol, italien — vos clients compris</p>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-red-500 mb-2" />
                <p className="font-medium text-sm">Urgences rétention</p>
                <p className="text-xs text-gray-500">Délais 48h détectés automatiquement, alertes immédiates</p>
              </div>
              <div className="bg-white border rounded-xl p-4">
                <Users className="w-5 h-5 text-green-600 mb-2" />
                <p className="font-medium text-sm">Équipe de 3</p>
                <p className="text-xs text-gray-500">Avocate + juriste + assistante — chacune son rôle dans MemoLib</p>
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
            <StepHeader step={1} title="Email urgent reçu" subtitle="Placement en rétention — CRA de Metz" />
            
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{DEMO_EMAIL.from}</p>
                  <p className="text-sm text-gray-500">{DEMO_EMAIL.subject}</p>
                </div>
                <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  CRITIQUE
                </span>
              </div>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{DEMO_EMAIL.body}</pre>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>En rétention : <strong>48h max</strong> avant audience JLD. Chaque minute compte.</span>
            </div>

            <div className="text-center">
              <p className="text-gray-500 mb-4">Sans MemoLib : rechercher les articles, calculer les délais, rédiger à la main...</p>
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
            <StepHeader step={2} title="Analyse IA complète en 3 secondes" subtitle="Urgence détectée, articles identifiés, forces du dossier" />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border p-5 space-y-3">
                <h3 className="font-semibold text-gray-900">📋 Résumé structuré</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Client</span><span className="font-medium">{DEMO_AI_SUMMARY.client}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium text-red-600">{DEMO_AI_SUMMARY.typeDossier}</span></div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Urgence</span>
                    <span className="px-2 py-0.5 bg-red-600 text-white rounded text-xs font-bold animate-pulse">{DEMO_AI_SUMMARY.urgence}</span>
                  </div>
                  <div className="flex justify-between"><span className="text-gray-500">Audience JLD</span><span className="font-bold text-red-600">{DEMO_AI_SUMMARY.deadlineJLD}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Recours TA</span><span className="font-bold text-red-600">{DEMO_AI_SUMMARY.deadlineRecours}</span></div>
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
                  <p className="text-sm font-medium text-blue-800">Langue détectée : {DEMO_AI_SUMMARY.langueDetectee}</p>
                  <p className="text-xs text-blue-600">Votre cabinet parle arabe — communication facilitée avec la famille</p>
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
            <StepHeader step={3} title="Dossier créé automatiquement" subtitle="Numéro, type, double deadline 48h, checklist pièces" />

            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{DEMO_DOSSIER.numero}</h3>
                  <p className="text-sm text-gray-500">{DEMO_DOSSIER.type}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-red-700 bg-red-100 px-3 py-1 rounded-full animate-pulse">
                    <AlertTriangle className="w-4 h-4" />
                    {DEMO_DOSSIER.deadline}
                  </span>
                  <span className="text-sm bg-red-600 text-white px-3 py-1 rounded-full font-medium">
                    {DEMO_DOSSIER.statut}
                  </span>
                </div>
              </div>

              <h4 className="font-medium text-gray-700 mb-3">📋 Checklist pièces (auto-générée pour rétention)</h4>
              <div className="grid md:grid-cols-2 gap-2">
                {DEMO_DOSSIER.checklist.map(item => (
                  <label key={item.label} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked={item.done} />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Double alerte 48h programmée</p>
                <p className="text-sm text-red-600">
                  1️⃣ Audience JLD (contestation rétention) — alerte dans 24h<br/>
                  2️⃣ Recours TA (OQTF sans délai) — alerte dans 24h<br/>
                  Notifications email + SMS + in-app
                </p>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
              <Users className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-purple-800">Attribution équipe</p>
                <p className="text-sm text-purple-600">
                  Me Blanvillain (avocate) · Juriste (recherche jurisprudence) · Assistante (collecte pièces client)
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
            <StepHeader step={4} title="Requête TA générée" subtitle="Tribunal Administratif de Metz — procédure 48h" />

            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">📄 Requête en annulation — TA de Metz — Procédure 48h</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Prêt à personnaliser</span>
              </div>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 p-4 rounded-lg border max-h-72 overflow-y-auto">{DEMO_DOCUMENT}</pre>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-gray-50 border rounded-lg p-3 text-sm">
                <p className="font-medium text-gray-700 mb-1">📝 Personnalisation</p>
                <p className="text-gray-500">Éditez directement dans MemoLib, ajoutez vos arguments spécifiques, exportez en PDF ou Word.</p>
              </div>
              <div className="bg-gray-50 border rounded-lg p-3 text-sm">
                <p className="font-medium text-gray-700 mb-1">🔍 Jurisprudence liée</p>
                <p className="text-gray-500">MemoLib recherche automatiquement les décisions TA Metz + CAA Nancy pertinentes.</p>
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
              2 heures gagnées sur ce dossier
            </h2>
            <p className="text-lg text-gray-500 max-w-lg mx-auto">
              <span className="line-through text-red-400">{TIME_SAVED.without}</span><br />
              <span className="text-green-600 font-medium">{TIME_SAVED.with}</span>
            </p>

            <div className="grid md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
              {[
                { icon: Mail, label: 'Email classifié', detail: 'Rétention + OQTF détectées' },
                { icon: Clock, label: 'Double deadline 48h', detail: 'JLD + recours TA alertés' },
                { icon: FolderPlus, label: 'Dossier complet', detail: 'Checklist rétention CESEDA' },
                { icon: FileText, label: 'Requête TA prête', detail: 'Art. 8 CEDH + CIDE argumentés' },
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
              <h3 className="font-semibold text-gray-900">Ce que MemoLib apporte à votre cabinet</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> <strong>Urgences CRA :</strong> détection automatique des délais 48h, alertes immédiates</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> <strong>Multi-langue :</strong> résumés en français même si le client écrit en arabe ou anglais</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> <strong>Équipe de 3 :</strong> rôles séparés (avocate / juriste / assistante), notifications ciblées</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> <strong>Droit routier aussi :</strong> templates contestation 48N/48SI, suspension permis</li>
                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> <strong>RGPD natif :</strong> données hébergées en France, anonymisation, droit à l&apos;oubli</li>
              </ul>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Shield className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-400">Chiffrement AES-256 • Hébergement France • Conforme RGPD • Secret professionnel respecté</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a
                href="/fr/signup?plan=CABINET&cabinet=Cabinet+Blanvillain&source=demo"
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
