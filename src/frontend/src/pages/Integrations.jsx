import {
  ArrowPathIcon,
  BoltIcon,
  BuildingLibraryIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  CloudIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  PhoneIcon,
  PuzzlePieceIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { Link } from "react-router-dom";

const Integrations = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { id: "all", name: "Toutes" },
    { id: "messaging", name: "Messagerie" },
    { id: "legal", name: "Juridique" },
    { id: "productivity", name: "Productivité" },
    { id: "cloud", name: "Cloud & Stockage" },
  ];

  const integrations = [
    // Messagerie
    {
      id: "outlook",
      name: "Microsoft Outlook",
      description: "Synchronisation emails, calendrier et contacts Office 365",
      category: "messaging",
      icon: EnvelopeIcon,
      color: "bg-blue-500",
      status: "connected",
      lastSync: "Il y a 2 min",
      features: ["Emails", "Calendrier", "Contacts", "Pièces jointes"],
    },
    {
      id: "gmail",
      name: "Google Workspace",
      description: "Intégration Gmail, Google Calendar et Google Drive",
      category: "messaging",
      icon: EnvelopeIcon,
      color: "bg-rose-500",
      status: "available",
      lastSync: null,
      features: ["Emails", "Calendrier", "Drive", "Contacts"],
    },
    {
      id: "whatsapp",
      name: "WhatsApp Business",
      description: "Réception et archivage des messages WhatsApp clients",
      category: "messaging",
      icon: ChatBubbleLeftRightIcon,
      color: "bg-emerald-500",
      status: "connected",
      lastSync: "Il y a 5 min",
      features: ["Messages", "Médias", "Archivage", "Notifications"],
    },
    {
      id: "twilio",
      name: "Twilio SMS",
      description: "Gestion des SMS entrants et sortants",
      category: "messaging",
      icon: PhoneIcon,
      color: "bg-red-500",
      status: "connected",
      lastSync: "Il y a 10 min",
      features: ["SMS", "MMS", "Notifications", "Rapports"],
    },
    // Juridique
    {
      id: "rpva",
      name: "RPVA / e-Barreau",
      description:
        "Réseau Privé Virtuel des Avocats - Communications tribunaux",
      category: "legal",
      icon: BuildingLibraryIcon,
      color: "bg-indigo-600",
      status: "connected",
      lastSync: "Il y a 15 min",
      features: ["Actes", "Convocations", "Décisions", "Notifications"],
    },
    {
      id: "lexisnexis",
      name: "LexisNexis",
      description: "Recherche juridique et documentation",
      category: "legal",
      icon: DocumentTextIcon,
      color: "bg-orange-500",
      status: "available",
      lastSync: null,
      features: ["Jurisprudence", "Doctrine", "Codes", "Formulaires"],
    },
    {
      id: "dalloz",
      name: "Dalloz",
      description: "Base de données juridiques et actualités",
      category: "legal",
      icon: DocumentTextIcon,
      color: "bg-amber-600",
      status: "available",
      lastSync: null,
      features: ["Codes", "Revues", "Encyclopédies", "Actualités"],
    },
    {
      id: "infogreffe",
      name: "Infogreffe",
      description: "Accès au registre du commerce et des sociétés",
      category: "legal",
      icon: BuildingLibraryIcon,
      color: "bg-teal-600",
      status: "connected",
      lastSync: "Hier",
      features: ["Kbis", "Statuts", "Bilans", "Formalités"],
    },
    // Productivité
    {
      id: "teams",
      name: "Microsoft Teams",
      description: "Collaboration et visioconférence",
      category: "productivity",
      icon: ChatBubbleLeftRightIcon,
      color: "bg-purple-600",
      status: "available",
      lastSync: null,
      features: ["Chat", "Visio", "Fichiers", "Canaux"],
    },
    {
      id: "calendly",
      name: "Calendly",
      description: "Prise de rendez-vous automatisée",
      category: "productivity",
      icon: CalendarIcon,
      color: "bg-blue-400",
      status: "connected",
      lastSync: "Il y a 1h",
      features: ["RDV", "Rappels", "Confirmations", "Synchronisation"],
    },
    {
      id: "docusign",
      name: "DocuSign",
      description: "Signature électronique de documents",
      category: "productivity",
      icon: DocumentTextIcon,
      color: "bg-yellow-500",
      status: "connected",
      lastSync: "Il y a 30 min",
      features: ["Signature", "Envoi", "Suivi", "Archivage"],
    },
    // Cloud
    {
      id: "onedrive",
      name: "OneDrive / SharePoint",
      description: "Stockage et partage de documents Microsoft",
      category: "cloud",
      icon: CloudIcon,
      color: "bg-sky-500",
      status: "connected",
      lastSync: "Il y a 3 min",
      features: ["Stockage", "Partage", "Versioning", "Collaboration"],
    },
    {
      id: "dropbox",
      name: "Dropbox",
      description: "Stockage cloud et synchronisation",
      category: "cloud",
      icon: CloudIcon,
      color: "bg-blue-600",
      status: "available",
      lastSync: null,
      features: ["Stockage", "Partage", "Synchronisation", "Sauvegarde"],
    },
    {
      id: "azure",
      name: "Azure Blob Storage",
      description: "Archivage sécurisé à long terme",
      category: "cloud",
      icon: CloudIcon,
      color: "bg-cyan-600",
      status: "connected",
      lastSync: "Il y a 1h",
      features: ["Archivage", "Chiffrement", "Conformité", "Rétention"],
    },
  ];

  const filteredIntegrations = integrations.filter(
    (i) => activeCategory === "all" || i.category === activeCategory,
  );

  const connectedCount = integrations.filter(
    (i) => i.status === "connected",
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ChevronLeftIcon className="h-5 w-5 mr-1" />
                Retour
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <PuzzlePieceIcon className="h-6 w-6 text-purple-600" />
                <h1 className="text-xl font-bold text-gray-900">
                  Intégrations
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {connectedCount} intégrations actives
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Intro */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100 mb-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <BoltIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Connectez vos outils métiers
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Intégrez IA Poste Manager avec vos systèmes existants :
                messagerie, outils juridiques, stockage cloud et applications de
                productivité utilisées par votre institution.
              </p>
              <div className="flex items-center space-x-4 mt-3">
                <span className="flex items-center text-sm text-emerald-600">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  {connectedCount} connectées
                </span>
                <span className="flex items-center text-sm text-gray-500">
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  {integrations.length - connectedCount} disponibles
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? "bg-purple-100 text-purple-700"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Integrations grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration) => (
            <div
              key={integration.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 ${integration.color} rounded-xl`}>
                  <integration.icon className="h-6 w-6 text-white" />
                </div>
                {integration.status === "connected" ? (
                  <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                    Connecté
                  </span>
                ) : (
                  <span className="flex items-center text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    Disponible
                  </span>
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-900">
                {integration.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {integration.description}
              </p>

              <div className="flex flex-wrap gap-1 mt-4">
                {integration.features.map((feature, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                {integration.status === "connected" ? (
                  <>
                    <span className="text-xs text-gray-500">
                      Sync: {integration.lastSync}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Synchroniser"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Paramètres"
                      >
                        <Cog6ToothIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                    Connecter
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* API Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                API & Webhooks
              </h3>
              <p className="text-sm text-gray-500">
                Intégrations personnalisées pour votre institution
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="font-medium text-gray-900">API REST</h4>
              <p className="text-sm text-gray-600 mt-1">
                Accès programmatique complet à vos données
              </p>
              <button className="text-sm text-purple-600 font-medium mt-2">
                Documentation →
              </button>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="font-medium text-gray-900">Webhooks</h4>
              <p className="text-sm text-gray-600 mt-1">
                Notifications en temps réel vers vos systèmes
              </p>
              <button className="text-sm text-purple-600 font-medium mt-2">
                Configurer →
              </button>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="font-medium text-gray-900">
                Connecteurs personnalisés
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Développement sur mesure par notre équipe
              </p>
              <button className="text-sm text-purple-600 font-medium mt-2">
                Nous contacter →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Integrations;
