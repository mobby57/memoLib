import {
  AdjustmentsHorizontalIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ClockIcon,
  DocumentIcon,
  EnvelopeIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { Link } from "react-router-dom";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    channel: "all",
    dateRange: "all",
    folder: "all",
    hasAttachment: false,
  });

  // Résultats de recherche simulés
  const searchResults = [
    {
      id: 1,
      type: "email",
      icon: EnvelopeIcon,
      from: "Cabinet Dupont & Associés",
      subject: "Dossier Martin - Conclusions signifiées",
      preview:
        "Maître, nous avons l'honneur de vous signifier nos conclusions récapitulatives dans l'affaire Martin c/ SCI Les Ormes...",
      date: "24/01/2026",
      folder: "Dossier Martin",
      highlights: ["conclusions", "Martin"],
      relevance: 95,
    },
    {
      id: 2,
      type: "document",
      icon: DocumentIcon,
      from: "Système",
      subject: "Contrat de bail - Martin Pierre",
      preview:
        "CONTRAT DE BAIL D'HABITATION. Entre les soussignés : M. Pierre Martin, demeurant au...",
      date: "15/01/2026",
      folder: "Dossier Martin",
      highlights: ["Martin", "contrat"],
      relevance: 88,
    },
    {
      id: 3,
      type: "whatsapp",
      icon: ChatBubbleLeftRightIcon,
      from: "Pierre Martin",
      subject: "Message WhatsApp",
      preview:
        "Bonjour Maître, j'ai bien reçu le projet de conclusions. Quelques remarques...",
      date: "22/01/2026",
      folder: "Dossier Martin",
      highlights: ["conclusions", "Martin"],
      relevance: 82,
    },
    {
      id: 4,
      type: "email",
      icon: EnvelopeIcon,
      from: "Tribunal de Grande Instance",
      subject: "Affaire Martin - Renvoi audience",
      preview:
        "Nous vous informons que l'audience initialement prévue le 1er février est reportée...",
      date: "20/01/2026",
      folder: "Dossier Martin",
      highlights: ["Martin", "audience"],
      relevance: 78,
    },
  ];

  // Recherches récentes
  const recentSearches = [
    "conclusions Martin",
    "convocation tribunal",
    "facture Mercier",
    "contrat bail",
    "délai appel",
  ];

  // Suggestions IA
  const aiSuggestions = [
    "Documents du dossier Martin avec échéances proches",
    "Messages non classés de la semaine dernière",
    "Tous les contrats en attente de signature",
  ];

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length > 2) {
      setIsSearching(true);
      // Simule une recherche
      setTimeout(() => setIsSearching(false), 500);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "email":
        return <EnvelopeIcon className="h-5 w-5 text-blue-500" />;
      case "whatsapp":
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-500" />;
      case "document":
        return <DocumentIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <DocumentIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const highlightText = (text, highlights) => {
    let result = text;
    highlights.forEach((term) => {
      const regex = new RegExp(`(${term})`, "gi");
      result = result.replace(
        regex,
        '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>',
      );
    });
    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };

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
                <MagnifyingGlassIcon className="h-6 w-6 text-amber-600" />
                <h1 className="text-xl font-bold text-gray-900">Recherche</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher dans tous les messages, documents, dossiers..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-12 pr-12 py-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
              <span>Filtres avancés</span>
            </button>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <SparklesIcon className="h-4 w-4 text-purple-500" />
              <span>Recherche intelligente activée</span>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Canal
                </label>
                <select
                  value={filters.channel}
                  onChange={(e) =>
                    setFilters({ ...filters, channel: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">Tous</option>
                  <option value="email">Emails</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                  <option value="document">Documents</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Période
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) =>
                    setFilters({ ...filters, dateRange: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">Toutes dates</option>
                  <option value="today">Aujourd'hui</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                  <option value="year">Cette année</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Dossier
                </label>
                <select
                  value={filters.folder}
                  onChange={(e) =>
                    setFilters({ ...filters, folder: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">Tous</option>
                  <option value="martin">Dossier Martin</option>
                  <option value="durand">Dossier Durand</option>
                  <option value="lefebvre">Dossier Lefebvre</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasAttachment}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        hasAttachment: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">
                    Avec pièces jointes
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Results or suggestions */}
        {searchQuery.length > 2 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{searchResults.length}</span>{" "}
                résultats pour "{searchQuery}"
              </p>
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option>Par pertinence</option>
                <option>Plus récent</option>
                <option>Plus ancien</option>
              </select>
            </div>

            {/* Search results */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {result.from}
                        </span>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-gray-500">
                            {result.date}
                          </span>
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                            {result.relevance}%
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 font-medium">
                        {highlightText(result.subject, result.highlights)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {highlightText(result.preview, result.highlights)}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          <FolderIcon className="h-3 w-3 mr-1" />
                          {result.folder}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Recent searches */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Recherches récentes
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Suggestions */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-100 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <SparklesIcon className="h-5 w-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Suggestions intelligentes
                </h2>
              </div>
              <div className="space-y-2">
                {aiSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(suggestion)}
                    className="w-full text-left px-4 py-3 bg-white hover:bg-purple-50 rounded-xl text-sm text-gray-700 transition-colors border border-purple-100"
                  >
                    <span className="text-purple-500 mr-2">→</span>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
