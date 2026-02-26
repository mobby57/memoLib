import {
  BuildingLibraryIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FingerPrintIcon,
  LockClosedIcon,
  ScaleIcon,
  ServerStackIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { Link } from "react-router-dom";

const Compliance = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // Statistiques de conformité
  const complianceStats = [
    {
      title: "Conformité RGPD",
      value: "98%",
      status: "success",
      icon: ShieldCheckIcon,
      description: "Données conformes au règlement",
    },
    {
      title: "Délais légaux",
      value: "3",
      status: "warning",
      icon: ClockIcon,
      description: "Échéances dans les 7 jours",
    },
    {
      title: "Documents archivés",
      value: "1,247",
      status: "success",
      icon: DocumentCheckIcon,
      description: "Avec horodatage certifié",
    },
    {
      title: "Accès audités",
      value: "100%",
      status: "success",
      icon: EyeIcon,
      description: "Traçabilité complète",
    },
  ];

  // Délais légaux en cours
  const legalDeadlines = [
    {
      id: 1,
      type: "Appel",
      dossier: "Dossier Martin",
      deadline: "28/01/2026",
      daysRemaining: 2,
      status: "critical",
      reference: "TGI-2024-8847",
      description: "Délai d'appel décision du 28/12/2025",
    },
    {
      id: 2,
      type: "Conclusions",
      dossier: "Dossier Lefebvre",
      deadline: "05/02/2026",
      daysRemaining: 10,
      status: "warning",
      reference: "CA-2025-1234",
      description: "Dépôt conclusions récapitulatives",
    },
    {
      id: 3,
      type: "Réponse administrative",
      dossier: "Dossier Durand",
      deadline: "15/02/2026",
      daysRemaining: 20,
      status: "normal",
      reference: "PREF-2025-5678",
      description: "Réponse recours gracieux préfecture",
    },
    {
      id: 4,
      type: "Prescription",
      dossier: "Dossier Mercier",
      deadline: "01/03/2026",
      daysRemaining: 34,
      status: "normal",
      reference: "CIVIL-2023-9999",
      description: "Prescription action civile",
    },
  ];

  // Journal d'audit récent
  const auditLog = [
    {
      id: 1,
      action: "Consultation dossier",
      user: "Me. Dubois",
      target: "Dossier Martin",
      timestamp: "26/01/2026 10:45:23",
      ip: "192.168.1.100",
      status: "success",
    },
    {
      id: 2,
      action: "Export document",
      user: "Me. Laurent",
      target: "Conclusions_Martin.pdf",
      timestamp: "26/01/2026 10:32:15",
      ip: "192.168.1.101",
      status: "success",
    },
    {
      id: 3,
      action: "Modification dossier",
      user: "Me. Dubois",
      target: "Dossier Lefebvre",
      timestamp: "26/01/2026 09:58:42",
      ip: "192.168.1.100",
      status: "success",
    },
    {
      id: 4,
      action: "Tentative accès refusée",
      user: "Stagiaire Martin",
      target: "Dossier Confidentiel",
      timestamp: "26/01/2026 09:15:33",
      ip: "192.168.1.105",
      status: "blocked",
    },
  ];

  // Règles de conservation des données
  const retentionRules = [
    {
      category: "Correspondances clients",
      duration: "10 ans",
      basis: "Art. 2224 Code Civil",
      autoDelete: true,
    },
    {
      category: "Actes authentiques",
      duration: "75 ans",
      basis: "Décret 79-1037",
      autoDelete: false,
    },
    {
      category: "Documents comptables",
      duration: "10 ans",
      basis: "Art. L123-22 Code Commerce",
      autoDelete: true,
    },
    {
      category: "Données personnelles",
      duration: "3 ans après fin relation",
      basis: "RGPD Art. 17",
      autoDelete: true,
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "critical":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "warning":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "normal":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "success":
        return "text-emerald-600";
      case "blocked":
        return "text-rose-600";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getDaysColor = (days) => {
    if (days <= 3) return "text-rose-600 bg-rose-50";
    if (days <= 7) return "text-amber-600 bg-amber-50";
    return "text-emerald-600 bg-emerald-50";
  };

  const tabs = [
    { id: "overview", name: "Vue d'ensemble", icon: ShieldCheckIcon },
    { id: "deadlines", name: "Délais légaux", icon: CalendarDaysIcon },
    { id: "audit", name: "Journal d'audit", icon: EyeIcon },
    { id: "retention", name: "Conservation", icon: ServerStackIcon },
    { id: "gdpr", name: "RGPD", icon: LockClosedIcon },
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
                <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
                <h1 className="text-xl font-bold text-gray-900">
                  Conformité & Audit
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>Exporter rapport</span>
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center space-x-2">
                <ScaleIcon className="h-4 w-4" />
                <span>Audit complet</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {complianceStats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-xl ${stat.status === "success" ? "bg-emerald-100" : "bg-amber-100"}`}
                >
                  <stat.icon
                    className={`h-6 w-6 ${stat.status === "success" ? "text-emerald-600" : "text-amber-600"}`}
                  />
                </div>
                {stat.status === "success" ? (
                  <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {stat.title}
              </p>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="border-b border-gray-100">
            <nav className="flex space-x-1 p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Délais légaux */}
            {activeTab === "deadlines" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Échéances légales
                  </h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      Prochains 90 jours
                    </span>
                  </div>
                </div>

                {legalDeadlines.map((deadline) => (
                  <div
                    key={deadline.id}
                    className={`p-4 rounded-xl border ${getStatusColor(deadline.status)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div
                          className={`px-3 py-1 rounded-lg text-sm font-bold ${getDaysColor(deadline.daysRemaining)}`}
                        >
                          J-{deadline.daysRemaining}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">
                              {deadline.type}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                              {deadline.reference}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {deadline.dossier}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {deadline.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {deadline.deadline}
                        </p>
                        <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-2">
                          Voir le dossier →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Journal d'audit */}
            {activeTab === "audit" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Journal d'audit
                  </h2>
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                    />
                    <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                      Filtrer
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Horodatage
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Utilisateur
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Action
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Cible
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          IP
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {auditLog.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                            {log.timestamp}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {log.user}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {log.action}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {log.target}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                            {log.ip}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                log.status === "success"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {log.status === "success" ? "OK" : "Bloqué"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Conservation */}
            {activeTab === "retention" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Règles de conservation
                  </h2>
                </div>

                <div className="grid gap-4">
                  {retentionRules.map((rule, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-xl border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {rule.category}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Base légale : {rule.basis}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-indigo-600">
                            {rule.duration}
                          </p>
                          <p className="text-xs text-gray-500">
                            {rule.autoDelete
                              ? "🔄 Suppression auto"
                              : "🔒 Conservation manuelle"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RGPD */}
            {activeTab === "gdpr" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Conformité RGPD
                  </h2>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                    Conforme
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
                      <h3 className="font-medium text-gray-900">
                        Droits des personnes
                      </h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>✓ Droit d'accès implémenté</li>
                      <li>✓ Droit de rectification</li>
                      <li>✓ Droit à l'effacement</li>
                      <li>✓ Droit à la portabilité</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <LockClosedIcon className="h-6 w-6 text-emerald-600" />
                      <h3 className="font-medium text-gray-900">
                        Sécurité des données
                      </h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>✓ Chiffrement AES-256</li>
                      <li>✓ Accès authentifié</li>
                      <li>✓ Journalisation complète</li>
                      <li>✓ Sauvegardes cryptées</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <BuildingLibraryIcon className="h-6 w-6 text-emerald-600" />
                      <h3 className="font-medium text-gray-900">Hébergement</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>✓ Serveurs en France / UE</li>
                      <li>✓ Certifié HDS (données santé)</li>
                      <li>✓ ISO 27001</li>
                      <li>✓ SOC 2 Type II</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <FingerPrintIcon className="h-6 w-6 text-emerald-600" />
                      <h3 className="font-medium text-gray-900">Traçabilité</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>✓ Registre de traitements</li>
                      <li>✓ Analyses d'impact (AIPD)</li>
                      <li>✓ DPO désigné</li>
                      <li>✓ Notifications CNIL</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Vue d'ensemble */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                      <BuildingLibraryIcon className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Plateforme certifiée pour institutions
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        memoLib répond aux exigences réglementaires des
                        cabinets d'avocats, notaires, administrations et
                        institutions publiques.
                      </p>
                      <div className="flex items-center space-x-4 mt-4">
                        <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-indigo-700 border border-indigo-200">
                          RGPD
                        </span>
                        <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-indigo-700 border border-indigo-200">
                          CNIL
                        </span>
                        <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-indigo-700 border border-indigo-200">
                          eIDAS
                        </span>
                        <span className="px-3 py-1 bg-white rounded-full text-xs font-medium text-indigo-700 border border-indigo-200">
                          HDS
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Échéances critiques
                      </span>
                      <span className="text-2xl font-bold text-rose-600">
                        1
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Dans les 3 prochains jours
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        À surveiller
                      </span>
                      <span className="text-2xl font-bold text-amber-600">
                        2
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Dans les 7 prochains jours
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Dossiers conformes
                      </span>
                      <span className="text-2xl font-bold text-emerald-600">
                        89
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Sur 89 dossiers actifs
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compliance;
