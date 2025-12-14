import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Copy, 
  Briefcase,
  RefreshCw,
  ThumbsUp,
  Calendar,
  DollarSign,
  AlertCircle,
  UserPlus,
  ClipboardCheck,
  Plane,
  Users,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import TemplateVariableModal from '../components/TemplateVariableModal';

export default function TemplatesPro() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const professionalTemplates = [
    {
      id: 1,
      name: 'Candidature / Lettre de motivation',
      category: 'emploi',
      icon: Briefcase,
      color: 'from-blue-500 to-blue-600',
      subject: 'Candidature pour le poste de [POSTE]',
      body: `Madame, Monsieur,

Je me permets de vous adresser ma candidature pour le poste de [POSTE] au sein de votre entreprise [NOM_ENTREPRISE].

Actuellement [SITUATION_ACTUELLE], je suis vivement intéressé(e) par cette opportunité qui correspond parfaitement à mon profil et à mes aspirations professionnelles.

Mon parcours m'a permis de développer des compétences en [COMPÉTENCES_CLÉS]. Je suis particulièrement motivé(e) par [MOTIVATION_SPÉCIFIQUE].

Je serais ravi(e) de vous rencontrer pour discuter plus en détail de ma candidature et de la façon dont je pourrais contribuer au développement de [NOM_ENTREPRISE].

Vous trouverez ci-joint mon CV détaillant mon parcours et mes réalisations.

Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

Cordialement,
[VOTRE_NOM]`,
      variables: ['POSTE', 'NOM_ENTREPRISE', 'SITUATION_ACTUELLE', 'COMPÉTENCES_CLÉS', 'MOTIVATION_SPÉCIFIQUE', 'VOTRE_NOM']
    },
    {
      id: 2,
      name: 'Email de relance / Follow-up',
      category: 'suivi',
      icon: RefreshCw,
      color: 'from-orange-500 to-orange-600',
      subject: 'Relance : [SUJET_INITIAL]',
      body: `Bonjour [NOM],

Je me permets de revenir vers vous concernant [SUJET].

Je vous avais contacté(e) le [DATE] et n'ayant pas eu de retour de votre part, je souhaitais m'assurer que mon message vous est bien parvenu.

[RAPPEL_CONTEXTE]

Pourriez-vous me confirmer la réception de ma demande et me donner une estimation du délai de traitement ?

Je reste à votre disposition pour tout complément d'information.

Merci d'avance pour votre retour.

Cordialement,
[VOTRE_NOM]`,
      variables: ['NOM', 'SUJET', 'DATE', 'RAPPEL_CONTEXTE', 'VOTRE_NOM']
    },
    {
      id: 3,
      name: 'Email de remerciement',
      category: 'relationnel',
      icon: ThumbsUp,
      color: 'from-green-500 to-green-600',
      subject: 'Merci pour [RAISON]',
      body: `Bonjour [NOM],

Je tenais à vous remercier sincèrement pour [RAISON_DÉTAILLÉE].

[IMPACT_POSITIF]

Votre [AIDE/CONTRIBUTION/TEMPS] a été extrêmement précieux(se) et m'a permis de [RÉSULTAT_OBTENU].

J'espère avoir l'occasion de vous rendre la pareille à l'avenir.

Encore merci pour votre générosité et votre professionnalisme.

Bien cordialement,
[VOTRE_NOM]`,
      variables: ['NOM', 'RAISON_DÉTAILLÉE', 'IMPACT_POSITIF', 'RÉSULTAT_OBTENU', 'VOTRE_NOM']
    },
    {
      id: 4,
      name: 'Demande de rendez-vous / Réunion',
      category: 'organisation',
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
      subject: 'Demande de rendez-vous - [OBJET]',
      body: `Bonjour [NOM],

J'aimerais organiser une rencontre avec vous afin de discuter de [SUJET].

[CONTEXTE_ET_OBJECTIF]

Seriez-vous disponible pour un rendez-vous [MODALITÉ: en personne/en visioconférence/téléphonique] ?

Voici quelques créneaux qui me conviennent :
- [DATE_1] à [HEURE_1]
- [DATE_2] à [HEURE_2]
- [DATE_3] à [HEURE_3]

N'hésitez pas à me proposer d'autres horaires si ceux-ci ne vous conviennent pas.

La réunion devrait durer environ [DURÉE].

Dans l'attente de votre retour.

Cordialement,
[VOTRE_NOM]`,
      variables: ['NOM', 'SUJET', 'CONTEXTE_ET_OBJECTIF', 'MODALITÉ', 'DATE_1', 'HEURE_1', 'DATE_2', 'HEURE_2', 'DATE_3', 'HEURE_3', 'DURÉE', 'VOTRE_NOM']
    },
    {
      id: 5,
      name: 'Facture / Demande de paiement',
      category: 'finance',
      icon: DollarSign,
      color: 'from-teal-500 to-teal-600',
      subject: 'Facture N°[NUMÉRO_FACTURE] - [DESCRIPTION]',
      body: `Bonjour [NOM],

Veuillez trouver ci-joint la facture N°[NUMÉRO_FACTURE] d'un montant de [MONTANT] € relative à [DESCRIPTION_PRESTATION].

Détails de la facture :
- Date d'émission : [DATE_ÉMISSION]
- Date d'échéance : [DATE_ÉCHÉANCE]
- Montant HT : [MONTANT_HT] €
- TVA : [TVA] €
- Montant TTC : [MONTANT_TTC] €

Modalités de paiement :
[COORDONNÉES_BANCAIRES]

Pour toute question concernant cette facture, n'hésitez pas à me contacter.

Je vous remercie de votre confiance et reste à votre disposition.

Cordialement,
[VOTRE_NOM]
[ENTREPRISE]`,
      variables: ['NOM', 'NUMÉRO_FACTURE', 'DESCRIPTION', 'MONTANT', 'DESCRIPTION_PRESTATION', 'DATE_ÉMISSION', 'DATE_ÉCHÉANCE', 'MONTANT_HT', 'TVA', 'MONTANT_TTC', 'COORDONNÉES_BANCAIRES', 'VOTRE_NOM', 'ENTREPRISE']
    },
    {
      id: 6,
      name: 'Réclamation / Signalement de problème',
      category: 'support',
      icon: AlertCircle,
      color: 'from-red-500 to-red-600',
      subject: 'Réclamation concernant [PROBLÈME]',
      body: `Madame, Monsieur,

Je me permets de vous contacter pour vous faire part d'un problème rencontré avec [PRODUIT/SERVICE].

Description du problème :
[DESCRIPTION_DÉTAILLÉE_PROBLÈME]

Circonstances :
- Date : [DATE_PROBLÈME]
- Référence de commande : [RÉFÉRENCE]
- [AUTRES_DÉTAILS]

[IMPACT_DU_PROBLÈME]

Je souhaiterais obtenir [SOLUTION_SOUHAITÉE : remboursement/remplacement/réparation/autre].

Vous trouverez ci-joint [PIÈCES_JUSTIFICATIVES].

Je vous remercie de bien vouloir traiter ma demande dans les meilleurs délais et reste à votre disposition pour tout complément d'information.

Dans l'attente de votre réponse.

Cordialement,
[VOTRE_NOM]
[COORDONNÉES]`,
      variables: ['PROBLÈME', 'PRODUIT/SERVICE', 'DESCRIPTION_DÉTAILLÉE_PROBLÈME', 'DATE_PROBLÈME', 'RÉFÉRENCE', 'IMPACT_DU_PROBLÈME', 'SOLUTION_SOUHAITÉE', 'PIÈCES_JUSTIFICATIVES', 'VOTRE_NOM', 'COORDONNÉES']
    },
    {
      id: 7,
      name: 'Email d\'introduction / Premier contact',
      category: 'relationnel',
      icon: UserPlus,
      color: 'from-indigo-500 to-indigo-600',
      subject: 'Introduction - [VOTRE_NOM] / [VOTRE_ENTREPRISE]',
      body: `Bonjour [NOM],

Je me présente, [VOTRE_NOM], [VOTRE_FONCTION] chez [VOTRE_ENTREPRISE].

[CONTEXTE_PRISE_CONTACT : J'ai obtenu vos coordonnées par.../J'ai découvert votre profil.../Nous avons un contact commun...]

Je vous contacte car [RAISON_CONTACT].

[BRÈVE_PRÉSENTATION_VOUS_OU_ENTREPRISE]

Je serais ravi(e) d'échanger avec vous sur [SUJET_DISCUSSION] et d'explorer d'éventuelles synergies entre nos activités.

Seriez-vous disponible pour un bref échange téléphonique ou un café dans les prochaines semaines ?

Au plaisir de vous lire.

Cordialement,
[VOTRE_NOM]
[FONCTION]
[ENTREPRISE]
[TÉLÉPHONE]`,
      variables: ['NOM', 'VOTRE_NOM', 'VOTRE_FONCTION', 'VOTRE_ENTREPRISE', 'CONTEXTE_PRISE_CONTACT', 'RAISON_CONTACT', 'BRÈVE_PRÉSENTATION', 'SUJET_DISCUSSION', 'TÉLÉPHONE']
    },
    {
      id: 8,
      name: 'Mise à jour de projet / Compte-rendu',
      category: 'gestion_projet',
      icon: ClipboardCheck,
      color: 'from-cyan-500 to-cyan-600',
      subject: 'Point d\'avancement - [NOM_PROJET]',
      body: `Bonjour à tous,

Voici le point d'avancement du projet [NOM_PROJET] pour la période du [DATE_DÉBUT] au [DATE_FIN].

✅ Tâches accomplies :
- [TÂCHE_1]
- [TÂCHE_2]
- [TÂCHE_3]

🚧 En cours :
- [TÂCHE_EN_COURS_1]
- [TÂCHE_EN_COURS_2]

📅 À venir :
- [TÂCHE_PRÉVUE_1]
- [TÂCHE_PRÉVUE_2]

⚠️ Points d'attention / Risques :
[POINTS_ATTENTION]

📊 Indicateurs :
- Avancement global : [POURCENTAGE]%
- Respect du budget : [OUI/NON - DÉTAILS]
- Respect des délais : [OUI/NON - DÉTAILS]

Prochaine réunion : [DATE_PROCHAINE_RÉUNION]

N'hésitez pas si vous avez des questions.

Cordialement,
[VOTRE_NOM]
Chef de projet`,
      variables: ['NOM_PROJET', 'DATE_DÉBUT', 'DATE_FIN', 'TÂCHE_1', 'TÂCHE_2', 'TÂCHE_3', 'POINTS_ATTENTION', 'POURCENTAGE', 'DATE_PROCHAINE_RÉUNION', 'VOTRE_NOM']
    },
    {
      id: 9,
      name: 'Message d\'absence / Out of Office',
      category: 'organisation',
      icon: Plane,
      color: 'from-amber-500 to-amber-600',
      subject: 'Absence du [DATE_DÉBUT] au [DATE_FIN]',
      body: `Bonjour,

Je serai absent(e) du bureau du [DATE_DÉBUT] au [DATE_FIN] inclus.

Durant cette période, je n'aurai pas accès à mes emails de manière régulière.

En cas d'urgence, vous pouvez contacter :
- [NOM_CONTACT_1] : [EMAIL_1] / [TÉLÉPHONE_1]
- [NOM_CONTACT_2] : [EMAIL_2] / [TÉLÉPHONE_2]

Pour les demandes non urgentes, je traiterai votre message dès mon retour le [DATE_RETOUR].

Je vous remercie de votre compréhension.

Cordialement,
[VOTRE_NOM]`,
      variables: ['DATE_DÉBUT', 'DATE_FIN', 'NOM_CONTACT_1', 'EMAIL_1', 'TÉLÉPHONE_1', 'NOM_CONTACT_2', 'EMAIL_2', 'TÉLÉPHONE_2', 'DATE_RETOUR', 'VOTRE_NOM']
    },
    {
      id: 10,
      name: 'Networking / Demande de connexion LinkedIn',
      category: 'relationnel',
      icon: Users,
      color: 'from-blue-600 to-blue-700',
      subject: 'Demande de connexion - [CONTEXTE]',
      body: `Bonjour [NOM],

J'ai découvert votre profil sur LinkedIn et je serais ravi(e) de faire partie de votre réseau.

[CONTEXTE_COMMUN : Nous avons tous deux participé à.../Nous travaillons dans le même secteur.../J'ai lu votre article sur...]

Je suis [VOTRE_FONCTION] chez [VOTRE_ENTREPRISE], spécialisé(e) en [SPÉCIALITÉ].

Votre parcours et votre expertise en [DOMAINE] m'intéressent particulièrement, notamment [ÉLÉMENT_SPÉCIFIQUE].

Je serais honoré(e) de pouvoir échanger avec vous et partager nos expériences professionnelles.

Au plaisir de se connecter !

Cordialement,
[VOTRE_NOM]
[FONCTION]
[LIEN_LINKEDIN]`,
      variables: ['NOM', 'CONTEXTE_COMMUN', 'VOTRE_FONCTION', 'VOTRE_ENTREPRISE', 'SPÉCIALITÉ', 'DOMAINE', 'ÉLÉMENT_SPÉCIFIQUE', 'VOTRE_NOM', 'FONCTION', 'LIEN_LINKEDIN']
    }
  ];

  const categories = [
    { id: 'all', name: 'Tous', icon: FileText, count: professionalTemplates.length },
    { id: 'emploi', name: 'Emploi', icon: Briefcase, count: professionalTemplates.filter(t => t.category === 'emploi').length },
    { id: 'suivi', name: 'Suivi', icon: RefreshCw, count: professionalTemplates.filter(t => t.category === 'suivi').length },
    { id: 'relationnel', name: 'Relationnel', icon: Users, count: professionalTemplates.filter(t => t.category === 'relationnel').length },
    { id: 'organisation', name: 'Organisation', icon: Calendar, count: professionalTemplates.filter(t => t.category === 'organisation').length },
    { id: 'finance', name: 'Finance', icon: DollarSign, count: professionalTemplates.filter(t => t.category === 'finance').length },
    { id: 'support', name: 'Support', icon: AlertCircle, count: professionalTemplates.filter(t => t.category === 'support').length },
    { id: 'gestion_projet', name: 'Projet', icon: ClipboardCheck, count: professionalTemplates.filter(t => t.category === 'gestion_projet').length },
  ];

  const filteredTemplates = professionalTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template) => {
    // Si le template a des variables, ouvrir le modal
    if (template.variables && template.variables.length > 0) {
      setSelectedTemplate(template);
      setShowVariableModal(true);
    } else {
      // Pas de variables, enregistrer directement
      localStorage.setItem('selectedTemplate', JSON.stringify(template));
      navigate('/send');
      toast.success(`Template "${template.name}" sélectionné !`);
    }
  };

  const handleVariablesComplete = (filledTemplate) => {
    localStorage.setItem('selectedTemplate', JSON.stringify(filledTemplate));
    setShowVariableModal(false);
    navigate('/send');
  };

  const handleVariablesCancel = () => {
    setShowVariableModal(false);
    setSelectedTemplate(null);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papier');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Templates Professionnels</h1>
            <p className="text-blue-100 mt-2">
              Les 10 emails professionnels les plus utilisés au monde - prêts à l'emploi
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card p-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un template..."
            className="input pl-12"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedCategory === cat.id ? 'bg-white/20' : 'bg-gray-300'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTemplates.map((template, index) => {
          const Icon = template.icon;
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card p-6 hover:shadow-xl transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${template.color} flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800 mb-1">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 font-medium">
                      📧 {template.subject}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body Preview */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">
                  {template.body.substring(0, 300)}
                  {template.body.length > 300 && '...'}
                </pre>
              </div>

              {/* Variables */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-600 mb-2">
                  Variables à personnaliser:
                </p>
                <div className="flex flex-wrap gap-1">
                  {template.variables.slice(0, 5).map((variable, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full"
                    >
                      {variable}
                    </span>
                  ))}
                  {template.variables.length > 5 && (
                    <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full">
                      +{template.variables.length - 5} autres
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="btn btn-primary flex-1 group-hover:shadow-md"
                >
                  <span>Utiliser</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
                <button
                  onClick={() => copyToClipboard(template.body)}
                  className="btn btn-secondary p-3"
                  title="Copier le contenu"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Aucun template trouvé</p>
          <p className="text-gray-400 text-sm">Essayez de modifier vos critères de recherche</p>
        </div>
      )}

      {/* Modal Variables */}
      {showVariableModal && selectedTemplate && (
        <TemplateVariableModal
          template={selectedTemplate}
          onComplete={handleVariablesComplete}
          onCancel={handleVariablesCancel}
        />
      )}
    </div>
  );
}
