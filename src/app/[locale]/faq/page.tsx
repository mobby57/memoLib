'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import {
  Bot,
  Building2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  FileText,
  HelpCircle,
  Phone,
  Scale,
  Shield,
} from 'lucide-react';
import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  // ===== QUESTIONS GÉNÉRALES =====
  {
    category: 'general',
    question: "Qu'est-ce qu'memoLib exactement ?",
    answer:
      'memoLib est un logiciel de gestion de cabinet juridique spécialisé dans le droit des étrangers (CESEDA). Il combine la gestion de dossiers, clients, facturation avec un assistant intelligent qui vous aide dans vos tâches administratives : classification des emails, pré-rédaction de courriers, recherche de jurisprudence, et suivi des délais légaux (OQTF, recours, etc.).',
  },
  {
    category: 'general',
    question: "À qui s'adresse memoLib ?",
    answer:
      "Notre solution est conçue pour : les avocats indépendants spécialisés en droit des étrangers, les cabinets d'avocats de toutes tailles, les associations d'aide aux migrants, et toute structure juridique traitant des dossiers CESEDA (titres de séjour, OQTF, naturalisation, regroupement familial, asile, etc.).",
  },
  {
    category: 'general',
    question: 'Le système peut-il remplacer un avocat ou prendre des décisions juridiques ?',
    answer:
      'NON, absolument pas. Le système est un ASSISTANT, jamais un décideur. Conformément à notre charte éthique et aux règles du Barreau, toute action importante (envoi de courrier, dépôt de recours, conseil au client) nécessite une validation humaine obligatoire. Le système suggère, vous décidez.',
  },
  {
    category: 'general',
    question: 'Est-ce compatible avec ma pratique solo/indépendante ?',
    answer:
      "Oui, notre plan Solo à 49€/mois est spécialement conçu pour les avocats indépendants. Il inclut jusqu'à 20 clients, 50 dossiers, et toutes les fonctionnalités IA de base. Vous pouvez évoluer vers un plan supérieur au fur et à mesure de votre croissance.",
  },
  {
    category: 'general',
    question: 'Puis-je utiliser memoLib si je ne suis pas spécialisé en CESEDA ?',
    answer:
      'Oui, bien que notre IA soit optimisée pour le CESEDA, la plateforme gère tous types de dossiers juridiques : civil, pénal, commercial, administratif, social. Vous bénéficierez simplement de moins de suggestions automatisées dans ces domaines.',
  },

  // ===== SÉCURITÉ & CONFIDENTIALITÉ =====
  {
    category: 'securite',
    question: 'Mes données clients sont-elles sécurisées ?',
    answer:
      'Absolument. Nous appliquons une isolation stricte par cabinet (architecture multi-tenant), un chiffrement AES-256 des données sensibles, une authentification 2FA, et des sauvegardes quotidiennes. Vos données ne sont jamais partagées entre cabinets et restent sur des serveurs européens conformes RGPD.',
  },
  {
    category: 'securite',
    question: 'Le secret professionnel est-il respecté ?',
    answer:
      "C'est notre priorité absolue. Chaque cabinet dispose de son propre espace isolé. Le moteur local (Ollama) peut traiter les données les plus sensibles sans qu'elles quittent votre environnement. Aucun collaborateur d'memoLib n'a accès au contenu de vos dossiers.",
  },
  {
    category: 'securite',
    question: 'Le système transmet-il mes données à des tiers (OpenAI, Google, etc.) ?',
    answer:
      "Par défaut, nous utilisons un moteur local (Ollama) qui fonctionne entièrement sur notre infrastructure sans envoyer de données à l'extérieur. Pour les fonctionnalités avancées optionnelles, nous utilisons Cloudflare AI Workers avec des données anonymisées et chiffrées.",
  },
  {
    category: 'securite',
    question: 'Comment puis-je supprimer toutes mes données ?',
    answer:
      'Vous pouvez demander la suppression complète de votre compte et de toutes vos données à tout moment en contactant support@memoLib.com. La suppression est effective sous 30 jours conformément au RGPD, avec un export préalable de vos données si souhaité.',
  },
  {
    category: 'securite',
    question: 'Êtes-vous conforme aux règles du Barreau ?',
    answer:
      "Oui, nous avons conçu memoLib en collaboration avec des avocats pour respecter : le secret professionnel, l'indépendance de l'avocat, la validation humaine obligatoire, et la traçabilité des actions. Le système assiste mais ne décide jamais.",
  },

  // ===== TARIFICATION & PAIEMENT =====
  {
    category: 'tarifs',
    question: 'Quels sont vos tarifs ?',
    answer:
      "Nous proposons 3 plans : Solo (49€/mois) pour les indépendants (20 clients, 50 dossiers), Cabinet (149€/mois) pour les petits cabinets (50 clients, 200 dossiers, 3 utilisateurs), et Enterprise (499€/mois) pour les grands cabinets (illimité). Réduction de 20% sur l'abonnement annuel.",
  },
  {
    category: 'tarifs',
    question: "Y a-t-il une période d'essai gratuite ?",
    answer:
      "Oui, nous offrons 14 jours d'essai gratuit sans carte bancaire et sans engagement. Vous avez accès à toutes les fonctionnalités du plan Cabinet pendant cette période pour tester l'outil en conditions réelles.",
  },
  {
    category: 'tarifs',
    question: 'Puis-je changer de plan à tout moment ?',
    answer:
      "Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. En cas d'upgrade, la différence est calculée au prorata. En cas de downgrade, le nouveau tarif s'applique au prochain cycle de facturation.",
  },
  {
    category: 'tarifs',
    question: 'Quels moyens de paiement acceptez-vous ?',
    answer:
      'Nous acceptons les cartes bancaires (Visa, Mastercard, American Express), les virements SEPA, et le prélèvement automatique. Pour les entreprises et institutions, nous proposons également la facturation sur devis.',
  },
  {
    category: 'tarifs',
    question: 'Les prix sont-ils HT ou TTC ?',
    answer:
      "Tous les prix affichés sont HT. La TVA française de 20% s'applique. Les clients hors UE ou avec un numéro de TVA intracommunautaire valide peuvent bénéficier de l'exonération.",
  },
  {
    category: 'tarifs',
    question: 'Y a-t-il des frais cachés ou des coûts supplémentaires ?',
    answer:
      "Non, le prix affiché inclut toutes les fonctionnalités du plan. Aucun frais de mise en service, d'installation ou de maintenance. Le stockage supplémentaire au-delà du quota est facturé 2€/Go/mois.",
  },
  {
    category: 'tarifs',
    question: 'Proposez-vous des tarifs pour les associations ou les aides juridiques ?',
    answer:
      "Oui, nous proposons une réduction de 30% pour les associations à but non lucratif et les structures d'aide juridique. Contactez-nous à commercial@memoLib.com avec votre justificatif.",
  },

  // ===== FONCTIONNALITÉS =====
  {
    category: 'fonctionnalites',
    question: 'Comment fonctionne la classification automatique des emails ?',
    answer:
      'Le système analyse automatiquement vos emails entrants et les classe par urgence, type de procédure (OQTF, titre de séjour, recours...), et client existant/nouveau. Il extrait les informations clés (dates, numéros de dossier, délais) et peut pré-remplir un dossier. Vous validez ou corrigez ensuite.',
  },
  {
    category: 'fonctionnalites',
    question: 'Le système peut-il rédiger des courriers à ma place ?',
    answer:
      'Le système peut PRÉ-RÉDIGER des courriers basés sur des modèles (accusés de réception, demandes de pièces, courriers préfecture). Vous devez TOUJOURS relire et valider avant envoi. Le système propose, vous disposez.',
  },
  {
    category: 'fonctionnalites',
    question: 'Comment sont gérés les délais OQTF et recours ?',
    answer:
      'Le système calcule automatiquement les délais légaux selon le type de procédure (48h, 15 jours, 30 jours, etc.), envoie des alertes par email et notification, affiche un calendrier des échéances, et vous notifie plusieurs jours avant chaque deadline critique.',
  },
  {
    category: 'fonctionnalites',
    question: 'Puis-je importer mes dossiers existants ?',
    answer:
      "Oui, nous proposons un import CSV/Excel pour vos clients et dossiers. Pour les gros volumes ou les migrations depuis d'autres logiciels (Jarvis, Secib, etc.), notre équipe peut vous accompagner avec un import assisté inclus dans le plan Enterprise.",
  },
  {
    category: 'fonctionnalites',
    question: 'La facturation est-elle intégrée ?',
    answer:
      "Oui, vous pouvez créer des factures directement liées à vos dossiers, gérer les honoraires, suivre les paiements, et exporter pour votre comptabilité. Nous ne gérons pas le paiement en ligne des clients (Stripe/PayPal) mais l'envoi de factures PDF.",
  },
  {
    category: 'fonctionnalites',
    question: "Puis-je accéder à l'application sur mobile ?",
    answer:
      "Oui, memoLib est une application web responsive accessible depuis n'importe quel navigateur (ordinateur, tablette, smartphone). Une application mobile native est en développement pour 2026.",
  },
  {
    category: 'fonctionnalites',
    question: "Existe-t-il une API pour intégrer d'autres outils ?",
    answer:
      "Oui, une API REST complète est disponible pour le plan Enterprise. Elle permet d'intégrer memoLib avec votre CRM, votre comptabilité, ou d'autres outils. Documentation disponible sur demande.",
  },

  // ===== INSTITUTIONS & CABINETS =====
  {
    category: 'institutions',
    question: 'Pouvons-nous avoir plusieurs utilisateurs/avocats ?',
    answer:
      'Oui, selon votre plan : 1 utilisateur (Solo), 3 utilisateurs (Cabinet), illimité (Enterprise). Chaque utilisateur a son propre accès avec des rôles personnalisables (avocat, collaborateur, secrétaire, stagiaire).',
  },
  {
    category: 'institutions',
    question: 'Comment gérer les permissions entre collaborateurs ?',
    answer:
      'Vous pouvez définir des rôles (Admin, Avocat, Collaborateur, Secrétaire) avec des permissions granulaires : accès aux dossiers (tous/assignés), modification, suppression, facturation, statistiques, etc.',
  },
  {
    category: 'institutions',
    question: 'Pouvons-nous avoir un sous-domaine personnalisé ?',
    answer:
      'Oui, pour les plans Cabinet et Enterprise. Votre cabinet accède via votrecabinet.memoLib.com. Un domaine entièrement personnalisé (app.votrecabinet.fr) est possible en Enterprise.',
  },
  {
    category: 'institutions',
    question: "Proposez-vous un contrat d'entreprise ou de marché public ?",
    answer:
      'Oui, pour les institutions publiques, associations et grandes structures, nous proposons des contrats adaptés avec SLA garanti, facturation sur devis, et conformité aux marchés publics. Contactez commercial@memoLib.com.',
  },
  {
    category: 'institutions',
    question: "Pouvons-nous bénéficier d'une formation pour l'équipe ?",
    answer:
      'Oui, inclus dans le plan Enterprise : 2h de formation visioconférence + documentation. Pour les autres plans, des webinaires mensuels gratuits sont organisés. Formation sur site disponible en option (nous consulter).',
  },

  // ===== SUPPORT & ASSISTANCE =====
  {
    category: 'support',
    question: 'Comment contacter le support technique ?',
    answer:
      'Plusieurs canaux selon votre plan : Email (tous les plans, réponse 48h), Chat en ligne (Cabinet+, réponse 24h), Téléphone (Enterprise, réponse 4h), Support dédié (Enterprise+). Email : support@memoLib.com',
  },
  {
    category: 'support',
    question: 'Y a-t-il une documentation ou des tutoriels ?',
    answer:
      "Oui, vous avez accès à : un guide de démarrage interactif, une base de connaissances complète, des tutoriels vidéo, et des webinaires mensuels. Accessible depuis l'application via l'icône d'aide.",
  },
  {
    category: 'support',
    question: "Que se passe-t-il si j'ai un bug urgent ?",
    answer:
      "Les bugs critiques affectant la production sont traités en priorité (SLA 4h pour Enterprise, 24h pour les autres plans). Signalez-les via le bouton 'Signaler un problème' dans l'application ou à urgence@memoLib.com.",
  },
  {
    category: 'support',
    question: 'Proposez-vous un accompagnement à la migration ?',
    answer:
      'Oui, inclus dans Enterprise. Pour les autres plans, un accompagnement optionnel est disponible : import de données, configuration initiale, formation. Tarif sur devis selon le volume.',
  },

  // ===== LÉGAL & CONFORMITÉ =====
  {
    category: 'legal',
    question: 'Où sont hébergées mes données ?',
    answer:
      'Vos données sont hébergées exclusivement en Union Européenne (France/Allemagne) sur des serveurs conformes RGPD, ISO 27001. Nous utilisons Azure France Central et Cloudflare EU pour garantir la souveraineté des données.',
  },
  {
    category: 'legal',
    question: "Êtes-vous certifiés pour l'hébergement de données de santé (HDS) ?",
    answer:
      'Non, nous ne sommes pas certifiés HDS. Si vos dossiers contiennent des données médicales sensibles (expertises, certificats médicaux détaillés), nous vous recommandons de les stocker séparément sur un hébergeur HDS agréé.',
  },
  {
    category: 'legal',
    question: 'Comment gérez-vous le RGPD ?',
    answer:
      "Nous sommes pleinement conformes RGPD : consentement explicite, droit d'accès/rectification/suppression, portabilité des données, notification en cas de violation, DPO désigné. Notre politique de confidentialité détaille tous ces points.",
  },
  {
    category: 'legal',
    question: 'Puis-je exporter toutes mes données ?',
    answer:
      "Oui, vous pouvez exporter vos données à tout moment en format standard (CSV, JSON, PDF). L'export inclut : clients, dossiers, documents, factures, historique. Accessible depuis Paramètres > Export des données.",
  },
  {
    category: 'legal',
    question: "Qui est responsable en cas d'erreur du système ?",
    answer:
      "L'avocat reste TOUJOURS responsable de ses actes professionnels. Le système est un outil d'aide, pas un décideur. Toute suggestion doit être validée par un humain avant action. Nous déclinons toute responsabilité pour des décisions prises sans validation humaine.",
  },

  // ===== TECHNIQUE =====
  {
    category: 'technique',
    question: 'Quels navigateurs sont supportés ?',
    answer:
      "Chrome, Firefox, Safari, Edge dans leurs versions récentes (2 dernières années). Internet Explorer n'est pas supporté. Pour une expérience optimale, nous recommandons Chrome ou Firefox.",
  },
  {
    category: 'technique',
    question: 'Y a-t-il des mises à jour régulières ?',
    answer:
      "Oui, nous déployons des améliorations continues (environ 2 mises à jour majeures/mois + corrections). Les mises à jour sont automatiques et transparentes, sans interruption de service. Un changelog est disponible dans l'application.",
  },
  {
    category: 'technique',
    question: 'Quelle est votre disponibilité (uptime) ?',
    answer:
      "Nous garantissons 99.9% de disponibilité (SLA Enterprise). En pratique, notre uptime moyen est de 99.95%. Les maintenances planifiées sont annoncées 48h à l'avance et effectuées en dehors des heures ouvrées.",
  },
  {
    category: 'technique',
    question: "L'application fonctionne-t-elle hors ligne ?",
    answer:
      'Non, une connexion internet est nécessaire. Cependant, les documents téléchargés en PDF restent accessibles hors ligne. Une fonctionnalité de mode dégradé hors-ligne est prévue pour 2026.',
  },
];

const CATEGORIES = [
  { id: 'general', label: 'Questions Générales', icon: HelpCircle },
  { id: 'securite', label: 'Sécurité & Confidentialité', icon: Shield },
  { id: 'tarifs', label: 'Tarification & Paiement', icon: CreditCard },
  { id: 'fonctionnalites', label: 'Fonctionnalités', icon: Bot },
  { id: 'institutions', label: 'Institutions & Cabinets', icon: Building2 },
  { id: 'support', label: 'Support & Assistance', icon: Phone },
  { id: 'legal', label: 'Légal & Conformité', icon: Scale },
  { id: 'technique', label: 'Technique', icon: FileText },
];

function FAQAccordion({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900">{item.question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-gray-700 leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string>('general');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleItem = (question: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(question)) {
      newOpenItems.delete(question);
    } else {
      newOpenItems.add(question);
    }
    setOpenItems(newOpenItems);
  };

  const filteredFAQ = FAQ_DATA.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Questions Fréquentes</h1>
          <p className="text-xl text-blue-100 mb-8">
            Trouvez rapidement les réponses à vos questions sur memoLib
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Rechercher une question..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-300"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-12 px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Categories */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-md p-4 sticky top-4">
              <h3 className="font-bold text-gray-900 mb-4 px-2">Catégories</h3>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeCategory === 'all'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <HelpCircle className="h-5 w-5" />
                  <span>Toutes les questions</span>
                </button>
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const count = FAQ_DATA.filter(f => f.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeCategory === cat.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span className="text-sm">{cat.label}</span>
                      </div>
                      <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{count}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* FAQ Content */}
          <div className="flex-1">
            {filteredFAQ.length === 0 ? (
              <div className="text-center py-12">
                <HelpCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucune question trouvée</p>
                <p className="text-gray-400">Essayez un autre terme de recherche</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-6">
                  {filteredFAQ.length} question{filteredFAQ.length > 1 ? 's' : ''} trouvée
                  {filteredFAQ.length > 1 ? 's' : ''}
                </p>
                {filteredFAQ.map((item, index) => (
                  <FAQAccordion
                    key={index}
                    item={item}
                    isOpen={openItems.has(item.question)}
                    onToggle={() => toggleItem(item.question)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Vous n'avez pas trouvé votre réponse ?
          </h2>
          <p className="text-gray-600 mb-6">
            Notre équipe est disponible pour répondre à toutes vos questions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@memoLib.com"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              📧 Contacter le support
            </a>
            <a
              href="tel:+33123456789"
              className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              📞 Nous appeler
            </a>
            <a
              href="/demo"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              🎯 Demander une démo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
