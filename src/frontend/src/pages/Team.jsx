import {
  BuildingOfficeIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  EnvelopeIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { Link } from "react-router-dom";

const Team = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  // Rôles disponibles pour une institution
  const roles = [
    {
      id: "admin",
      name: "Administrateur",
      color: "bg-purple-100 text-purple-700",
      permissions: "Accès total",
    },
    {
      id: "partner",
      name: "Associé",
      color: "bg-blue-100 text-blue-700",
      permissions: "Gestion dossiers + équipe",
    },
    {
      id: "lawyer",
      name: "Collaborateur",
      color: "bg-emerald-100 text-emerald-700",
      permissions: "Dossiers assignés",
    },
    {
      id: "paralegal",
      name: "Assistant juridique",
      color: "bg-amber-100 text-amber-700",
      permissions: "Lecture + commentaires",
    },
    {
      id: "intern",
      name: "Stagiaire",
      color: "bg-gray-100 text-gray-700",
      permissions: "Lecture seule (limité)",
    },
    {
      id: "external",
      name: "Intervenant externe",
      color: "bg-rose-100 text-rose-700",
      permissions: "Dossiers spécifiques",
    },
  ];

  // Membres de l'équipe
  const teamMembers = [
    {
      id: 1,
      name: "Me. Jean-Pierre Dubois",
      role: "partner",
      email: "jp.dubois@cabinet-dubois.fr",
      phone: "+33 1 42 56 78 90",
      department: "Droit des affaires",
      status: "online",
      lastActive: "En ligne",
      dossiersCount: 34,
      avatar: "JPD",
    },
    {
      id: 2,
      name: "Me. Sophie Laurent",
      role: "partner",
      email: "s.laurent@cabinet-dubois.fr",
      phone: "+33 1 42 56 78 91",
      department: "Droit de la famille",
      status: "online",
      lastActive: "En ligne",
      dossiersCount: 28,
      avatar: "SL",
    },
    {
      id: 3,
      name: "Me. Thomas Martin",
      role: "lawyer",
      email: "t.martin@cabinet-dubois.fr",
      phone: "+33 1 42 56 78 92",
      department: "Contentieux",
      status: "online",
      lastActive: "En ligne",
      dossiersCount: 18,
      avatar: "TM",
    },
    {
      id: 4,
      name: "Marie Durand",
      role: "paralegal",
      email: "m.durand@cabinet-dubois.fr",
      phone: "+33 1 42 56 78 93",
      department: "Secrétariat juridique",
      status: "away",
      lastActive: "Il y a 15 min",
      dossiersCount: 45,
      avatar: "MD",
    },
    {
      id: 5,
      name: "Lucas Bernard",
      role: "intern",
      email: "l.bernard@cabinet-dubois.fr",
      phone: "+33 1 42 56 78 94",
      department: "Stage - Droit des affaires",
      status: "offline",
      lastActive: "Hier 18h30",
      dossiersCount: 5,
      avatar: "LB",
    },
    {
      id: 6,
      name: "Cabinet Expert Comptable",
      role: "external",
      email: "contact@expert-comptable.fr",
      phone: "+33 1 40 12 34 56",
      department: "Comptabilité / Fiscal",
      status: "offline",
      lastActive: "23/01/2026",
      dossiersCount: 12,
      avatar: "EC",
    },
  ];

  const getStatusIndicator = (status) => {
    switch (status) {
      case "online":
        return (
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        );
      case "away":
        return <span className="h-3 w-3 rounded-full bg-amber-400"></span>;
      case "offline":
        return <span className="h-3 w-3 rounded-full bg-gray-300"></span>;
      default:
        return null;
    }
  };

  const getRoleBadge = (roleId) => {
    const role = roles.find((r) => r.id === roleId);
    return role ? (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${role.color}`}
      >
        {role.name}
      </span>
    ) : null;
  };

  const filteredMembers = teamMembers.filter((member) => {
    if (selectedRole !== "all" && member.role !== selectedRole) return false;
    if (
      searchQuery &&
      !member.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !member.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

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
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">
                  Équipe & Accès
                </h1>
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center space-x-2">
              <PlusIcon className="h-4 w-4" />
              <span>Inviter un membre</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Membres actifs</p>
              <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {teamMembers.filter((m) => m.status === "online").length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Total équipe</p>
              <UserGroupIcon className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {teamMembers.length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Intervenants externes</p>
              <BuildingOfficeIcon className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {teamMembers.filter((m) => m.role === "external").length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Invitations en attente</p>
              <ClockIcon className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">2</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Rôles */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Filtrer par rôle
              </h3>
              <nav className="space-y-1">
                <button
                  onClick={() => setSelectedRole("all")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedRole === "all"
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>Tous les rôles</span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                    {teamMembers.length}
                  </span>
                </button>
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedRole === role.id
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{role.name}</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                      {teamMembers.filter((m) => m.role === role.id).length}
                    </span>
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Légende des rôles
                </h3>
                <div className="space-y-2">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span
                        className={`px-2 py-0.5 rounded-full ${role.color}`}
                      >
                        {role.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main - Liste des membres */}
          <div className="lg:col-span-3">
            {/* Search */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher un membre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Members grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                          {member.avatar}
                        </div>
                        <div className="absolute -bottom-1 -right-1">
                          {getStatusIndicator(member.status)}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {member.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {member.lastActive}
                        </p>
                      </div>
                    </div>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <EllipsisVerticalIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    {getRoleBadge(member.role)}
                    <p className="text-sm text-gray-600">{member.department}</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <PhoneIcon className="h-4 w-4 text-gray-400" />
                      <span>{member.phone}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {member.dossiersCount} dossiers
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Gérer les accès"
                      >
                        <KeyIcon className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        title="Permissions"
                      >
                        <ShieldCheckIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Team;
