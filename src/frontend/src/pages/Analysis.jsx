import {
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ClockIcon,
  DocumentMagnifyingGlassIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  FunnelIcon,
  LightBulbIcon,
  SparklesIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { Link } from "react-router-dom";

const Analysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("week");

  // Statistiques d'analyse
  const analysisStats = [
    {
      title: "Messages analysés",
      value: "1,247",
      subtitle: "Cette semaine",
      icon: DocumentMagnifyingGlassIcon,
      color: "bg-purple-500",
      trend: "+18%",
    },
    {
      title: "Classification auto",
      value: "94.2%",
      subtitle: "Taux de précision",
      icon: TagIcon,
      color: "bg-emerald-500",
      trend: "+2.3%",
    },
    {
      title: "Temps moyen",
      value: "0.8s",
      subtitle: "Par message",
      icon: ClockIcon,
      color: "bg-blue-500",
      trend: "-0.2s",
    },
    {
      title: "Alertes générées",
      value: "23",
      subtitle: "Actions requises",
      icon: ExclamationTriangleIcon,
      color: "bg-amber-500",
      trend: null,
    },
  ];

  // Catégories détectées
  const categories = [
    { name: "Contentieux", count: 245, percentage: 32, color: "bg-rose-500" },
    { name: "Administratif", count: 189, percentage: 25, color: "bg-blue-500" },
    { name: "Commercial", count: 156, percentage: 20, color: "bg-emerald-500" },
    { name: "Conseil", count: 112, percentage: 15, color: "bg-purple-500" },
    { name: "Autres", count: 61, percentage: 8, color: "bg-gray-500" },
  ];

  // Insights IA récents
  const aiInsights = [
    {
      id: 1,
      type: "alert",
      icon: ExclamationTriangleIcon,
      title: "Échéance critique détectée",
      description:
        "Dossier Lefebvre : délai de réponse au tribunal dans 48h. Aucune action enregistrée.",
      action: "Voir le dossier",
      severity: "high",
      time: "Il y a 10 min",
    },
    {
      id: 2,
      type: "suggestion",
      icon: LightBulbIcon,
      title: "Regroupement suggéré",
      description:
        "12 messages de Compagnie Assurance Plus pourraient être liés au dossier Mercier.",
      action: "Valider le regroupement",
      severity: "medium",
      time: "Il y a 25 min",
    },
    {
      id: 3,
      type: "info",
      icon: ArrowTrendingUpIcon,
      title: "Tendance détectée",
      description:
        "Volume de messages en hausse de 30% par rapport à la semaine dernière.",
      action: "Voir les détails",
      severity: "low",
      time: "Il y a 1 heure",
    },
    {
      id: 4,
      type: "alert",
      icon: DocumentTextIcon,
      title: "Document important identifié",
      description:
        "Une décision de justice a été reçue pour le dossier Martin. Classification automatique effectuée.",
      action: "Réviser",
      severity: "medium",
      time: "Il y a 2 heures",
    },
  ];

  // Messages en attente de classification
  const pendingClassification = [
    {
      id: 1,
      from: "inconnu@email.com",
      subject: "Demande d'information",
      suggestedFolder: "Nouveau dossier",
      confidence: 45,
      preview:
        "Bonjour, je souhaiterais obtenir des informations concernant...",
    },
    {
      id: 2,
      from: "notification@bank.fr",
      subject: "Relevé de compte mensuel",
      suggestedFolder: "Administratif",
      confidence: 78,
      preview:
        "Veuillez trouver ci-joint votre relevé de compte pour le mois de...",
    },
    {
      id: 3,
      from: "contact@fournisseur.com",
      subject: "Facture n°2024-0892",
      suggestedFolder: "Comptabilité",
      confidence: 92,
      preview:
        "Merci de trouver ci-joint notre facture n°2024-0892 pour les services...",
    },
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "bg-rose-50 border-rose-200";
      case "medium":
        return "bg-amber-50 border-amber-200";
      case "low":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "high":
        return "text-rose-500";
      case "medium":
        return "text-amber-500";
      case "low":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 3000);
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
                <SparklesIcon className="h-6 w-6 text-purple-600" />
                <h1 className="text-xl font-bold text-gray-900">Analyse IA</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="day">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="year">Cette année</option>
              </select>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center space-x-2 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    <span>Analyse en cours...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4" />
                    <span>Lancer une analyse</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {analysisStats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                {stat.trend && (
                  <span className="flex items-center text-sm font-medium text-emerald-600">
                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    {stat.trend}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {stat.title}
                </p>
                <p className="text-xs text-gray-500">{stat.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Insights */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <SparklesIcon className="h-5 w-5 text-purple-500" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Insights IA
                    </h2>
                  </div>
                  <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                    Voir tout
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {aiInsights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`p-4 ${getSeverityColor(insight.severity)} border-l-4`}
                  >
                    <div className="flex items-start space-x-3">
                      <insight.icon
                        className={`h-5 w-5 flex-shrink-0 ${getSeverityIcon(insight.severity)}`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900">
                            {insight.title}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {insight.time}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {insight.description}
                        </p>
                        <button className="text-sm text-purple-600 hover:text-purple-700 font-medium mt-2">
                          {insight.action} →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Classification */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FunnelIcon className="h-5 w-5 text-amber-500" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      En attente de classification
                    </h2>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                      {pendingClassification.length}
                    </span>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {pendingClassification.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {item.from}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">
                          {item.subject}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {item.preview}
                        </p>
                        <div className="flex items-center space-x-3 mt-3">
                          <div className="flex items-center space-x-2">
                            <FolderIcon className="h-4 w-4 text-emerald-500" />
                            <span className="text-xs text-gray-600">
                              Suggestion: {item.suggestedFolder}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${item.confidence >= 80 ? "bg-emerald-500" : item.confidence >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                                style={{ width: `${item.confidence}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 ml-2">
                              {item.confidence}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button className="px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100">
                          Valider
                        </button>
                        <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                          Modifier
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Categories distribution */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <ChartBarIcon className="h-5 w-5 text-blue-500" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Répartition
                  </h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {categories.map((category, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">
                        {category.name}
                      </span>
                      <span className="text-gray-500">{category.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${category.color} rounded-full transition-all`}
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  Actions rapides
                </h2>
              </div>
              <div className="p-4 space-y-2">
                <button className="w-full flex items-center space-x-3 px-4 py-3 text-left rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <DocumentMagnifyingGlassIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Analyser tout
                    </p>
                    <p className="text-xs text-gray-500">
                      Relancer l'analyse complète
                    </p>
                  </div>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-3 text-left rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Valider les suggestions
                    </p>
                    <p className="text-xs text-gray-500">
                      Appliquer toutes les recommandations
                    </p>
                  </div>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-3 text-left rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <TagIcon className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Créer des règles
                    </p>
                    <p className="text-xs text-gray-500">
                      Automatiser la classification
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
