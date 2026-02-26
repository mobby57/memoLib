import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  DocumentIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  FolderIcon,
  FolderOpenIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { Link } from "react-router-dom";

const Folders = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState(null);

  const folders = [
    {
      id: 1,
      name: "Dossier Martin",
      client: "M. Pierre Martin",
      type: "Contentieux",
      status: "active",
      messagesCount: 47,
      documentsCount: 23,
      lastActivity: "Il y a 2 heures",
      createdAt: "15/01/2024",
      priority: "high",
      progress: 65,
      nextDeadline: "15/02/2026",
      aiInsight: "Audience prévue dans 3 semaines - Documents complets",
    },
    {
      id: 2,
      name: "Dossier Durand",
      client: "Mme Marie Durand",
      type: "Conseil",
      status: "active",
      messagesCount: 28,
      documentsCount: 12,
      lastActivity: "Il y a 5 heures",
      createdAt: "20/12/2023",
      priority: "medium",
      progress: 40,
      nextDeadline: "28/02/2026",
      aiInsight: "En attente de réponse client depuis 3 jours",
    },
    {
      id: 3,
      name: "Dossier Lefebvre",
      client: "SARL Lefebvre & Fils",
      type: "Commercial",
      status: "active",
      messagesCount: 89,
      documentsCount: 45,
      lastActivity: "Hier",
      createdAt: "05/09/2023",
      priority: "high",
      progress: 85,
      nextDeadline: "10/02/2026",
      aiInsight: "Délai de réponse dans 48h - Action requise",
    },
    {
      id: 4,
      name: "Dossier Mercier",
      client: "M. Jean Mercier",
      type: "Assurance",
      status: "active",
      messagesCount: 34,
      documentsCount: 18,
      lastActivity: "Il y a 3 jours",
      createdAt: "10/11/2023",
      priority: "medium",
      progress: 55,
      nextDeadline: "05/03/2026",
      aiInsight: "Offre d'indemnisation reçue - À valider",
    },
    {
      id: 5,
      name: "Dossier Bernard",
      client: "Mme Sophie Bernard",
      type: "Famille",
      status: "pending",
      messagesCount: 15,
      documentsCount: 8,
      lastActivity: "Il y a 1 semaine",
      createdAt: "02/01/2024",
      priority: "low",
      progress: 20,
      nextDeadline: "15/03/2026",
      aiInsight: "Dossier en constitution - Documents manquants",
    },
    {
      id: 6,
      name: "Procédures Tribunal",
      client: "Multi-clients",
      type: "Juridique",
      status: "active",
      messagesCount: 156,
      documentsCount: 89,
      lastActivity: "Aujourd'hui",
      createdAt: "01/01/2023",
      priority: "high",
      progress: 100,
      nextDeadline: null,
      aiInsight: "Dossier de suivi des convocations et audiences",
    },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
            Actif
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
            En attente
          </span>
        );
      case "closed":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
            Clos
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityIndicator = (priority) => {
    switch (priority) {
      case "high":
        return "border-l-rose-500";
      case "medium":
        return "border-l-amber-500";
      case "low":
        return "border-l-gray-300";
      default:
        return "border-l-gray-200";
    }
  };

  const filteredFolders = folders.filter(
    (folder) =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      folder.client.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const stats = [
    {
      label: "Dossiers actifs",
      value: folders.filter((f) => f.status === "active").length,
      color: "text-emerald-600",
    },
    {
      label: "En attente",
      value: folders.filter((f) => f.status === "pending").length,
      color: "text-amber-600",
    },
    {
      label: "Total messages",
      value: folders.reduce((acc, f) => acc + f.messagesCount, 0),
      color: "text-blue-600",
    },
    {
      label: "Total documents",
      value: folders.reduce((acc, f) => acc + f.documentsCount, 0),
      color: "text-purple-600",
    },
  ];

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
                <FolderIcon className="h-6 w-6 text-emerald-600" />
                <h1 className="text-xl font-bold text-gray-900">Dossiers</h1>
              </div>
            </div>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center space-x-2">
              <PlusIcon className="h-4 w-4" />
              <span>Nouveau dossier</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un dossier ou un client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Folders grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFolders.map((folder) => (
            <div
              key={folder.id}
              className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${getPriorityIndicator(folder.priority)} hover:shadow-md transition-shadow cursor-pointer`}
              onClick={() => setSelectedFolder(folder.id)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <FolderOpenIcon className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {folder.name}
                      </h3>
                      <p className="text-sm text-gray-500">{folder.client}</p>
                    </div>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <EllipsisVerticalIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center space-x-2 mb-4">
                  {getStatusBadge(folder.status)}
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                    {folder.type}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Progression</span>
                    <span>{folder.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                      style={{ width: `${folder.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                    <span>{folder.messagesCount} messages</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <DocumentIcon className="h-4 w-4 text-gray-400" />
                    <span>{folder.documentsCount} documents</span>
                  </div>
                </div>

                {folder.nextDeadline && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                    <CalendarIcon className="h-4 w-4 text-rose-500" />
                    <span className="text-rose-600 font-medium">
                      Échéance: {folder.nextDeadline}
                    </span>
                  </div>
                )}

                {/* AI Insight */}
                <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
                  <div className="flex items-start space-x-2">
                    <SparklesIcon className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-700">
                      {folder.aiInsight}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <ClockIcon className="h-4 w-4" />
                    <span>{folder.lastActivity}</span>
                  </div>
                  <Link
                    to={`/folders/${folder.id}`}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center"
                  >
                    Ouvrir
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Folders;
