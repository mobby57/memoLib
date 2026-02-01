'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { StatCard } from '@/components/ui/StatCard';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Pagination } from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterSelect } from '@/components/ui/FilterSelect';
import {
  FileText,
  Plus,
  Download,
  Pencil,
  Trash2,
  Eye,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Archive,
  Calendar,
} from 'lucide-react';

const dossierSchema = z.object({
  numero: z.string().min(1, 'Le numero est requis'),
  titre: z.string().min(3, 'Le titre doit contenir au moins 3 caracteres'),
  clientId: z.string().min(1, 'Le client est requis'),
  type: z.enum(['CIVIL', 'PENAL', 'COMMERCIAL', 'ADMINISTRATIF']),
  statut: z.enum(['EN_COURS', 'CLOS', 'EN_ATTENTE', 'ARCHIVE']),
  dateOuverture: z.string().min(1, "La date d'ouverture est requise"),
  dateCloture: z.string().optional(),
  description: z.string().optional(),
});

type DossierFormData = z.infer<typeof dossierSchema>;

interface Dossier extends DossierFormData {
  id: string;
  clientNom: string;
}

const MOCK_DOSSIERS: Dossier[] = [
  {
    id: '1',
    numero: 'DOS-2024-001',
    titre: 'Litige commercial SARL Martin',
    clientId: '1',
    clientNom: 'Jean Dupont',
    type: 'COMMERCIAL',
    statut: 'EN_COURS',
    dateOuverture: '2024-01-15',
    description: 'Litige avec fournisseur sur qualite marchandise',
  },
  {
    id: '2',
    numero: 'DOS-2024-002',
    titre: 'Divorce contentieux',
    clientId: '2',
    clientNom: 'Marie Martin',
    type: 'CIVIL',
    statut: 'EN_COURS',
    dateOuverture: '2024-02-20',
  },
  {
    id: '3',
    numero: 'DOS-2024-003',
    titre: 'Contentieux administratif permis construire',
    clientId: '3',
    clientNom: 'SCI Investimo',
    type: 'ADMINISTRATIF',
    statut: 'EN_ATTENTE',
    dateOuverture: '2024-03-10',
  },
  {
    id: '4',
    numero: 'DOS-2023-045',
    titre: 'Defense penale - Vol',
    clientId: '4',
    clientNom: 'Thomas Bernard',
    type: 'PENAL',
    statut: 'CLOS',
    dateOuverture: '2023-11-05',
    dateCloture: '2024-01-20',
  },
  {
    id: '5',
    numero: 'DOS-2023-032',
    titre: 'Succession familiale',
    clientId: '5',
    clientNom: 'Sophie Dubois',
    type: 'CIVIL',
    statut: 'ARCHIVE',
    dateOuverture: '2023-09-12',
    dateCloture: '2023-12-30',
  },
];

const MOCK_CLIENTS = [
  { id: '1', nom: 'Jean Dupont' },
  { id: '2', nom: 'Marie Martin' },
  { id: '3', nom: 'SCI Investimo' },
  { id: '4', nom: 'Thomas Bernard' },
  { id: '5', nom: 'Sophie Dubois' },
];

const TYPE_LABELS = {
  CIVIL: 'Civil',
  PENAL: 'Penal',
  COMMERCIAL: 'Commercial',
  ADMINISTRATIF: 'Administratif',
};

const STATUT_LABELS = {
  EN_COURS: 'En cours',
  CLOS: 'Clos',
  EN_ATTENTE: 'En attente',
  ARCHIVE: 'Archivé',
};

const STATUT_COLORS: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  EN_COURS: 'info',
  CLOS: 'success',
  EN_ATTENTE: 'warning',
  ARCHIVE: 'default',
};

// Options for filter selects
const TYPE_OPTIONS = [
  { value: 'ALL', label: 'Tous les types' },
  ...Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

const STATUT_OPTIONS = [
  { value: 'ALL', label: 'Tous les statuts' },
  ...Object.entries(STATUT_LABELS).map(([value, label]) => ({ value, label })),
];

export default function DossiersPage() {
  const router = useRouter();
  const [dossiers, setDossiers] = useState<Dossier[]>(MOCK_DOSSIERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDossier, setEditingDossier] = useState<Dossier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statutFilter, setStatutFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 10;

  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DossierFormData>({
    resolver: zodResolver(dossierSchema),
  });

  // Filtrage et recherche
  const filteredDossiers = useMemo(() => {
    return dossiers.filter(dossier => {
      const matchSearch =
        dossier.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dossier.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dossier.clientNom.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = typeFilter === 'ALL' || dossier.type === typeFilter;
      const matchStatut = statutFilter === 'ALL' || dossier.statut === statutFilter;

      return matchSearch && matchType && matchStatut;
    });
  }, [dossiers, searchTerm, typeFilter, statutFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredDossiers.length / itemsPerPage);
  const paginatedDossiers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDossiers.slice(start, start + itemsPerPage);
  }, [filteredDossiers, currentPage]);

  // Statistiques
  const stats = useMemo(
    () => ({
      total: dossiers.length,
      enCours: dossiers.filter(d => d.statut === 'EN_COURS').length,
      enAttente: dossiers.filter(d => d.statut === 'EN_ATTENTE').length,
      clos: dossiers.filter(d => d.statut === 'CLOS').length,
    }),
    [dossiers]
  );

  const openCreateModal = () => {
    setEditingDossier(null);
    reset({
      numero: '',
      titre: '',
      clientId: '',
      type: 'CIVIL',
      statut: 'EN_COURS',
      dateOuverture: new Date().toISOString().split('T')[0],
      description: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (dossier: Dossier) => {
    setEditingDossier(dossier);
    reset(dossier);
    setIsModalOpen(true);
  };

  const onSubmit = (data: DossierFormData) => {
    if (editingDossier) {
      setDossiers(prev =>
        prev.map(d =>
          d.id === editingDossier.id
            ? {
                ...d,
                ...data,
                clientNom: MOCK_CLIENTS.find(c => c.id === data.clientId)?.nom || '',
              }
            : d
        )
      );
      toast({
        variant: 'success',
        title: 'Dossier modifie',
        description: `Le dossier ${data.numero} a ete modifie avec succes.`,
      });
    } else {
      const newDossier: Dossier = {
        ...data,
        id: Date.now().toString(),
        clientNom: MOCK_CLIENTS.find(c => c.id === data.clientId)?.nom || '',
      };
      setDossiers(prev => [newDossier, ...prev]);
      toast({
        variant: 'success',
        title: 'Dossier cree',
        description: `Le dossier ${data.numero} a ete cree avec succes.`,
      });
    }
    setIsModalOpen(false);
  };

  const deleteDossier = useCallback(
    (id: string) => {
      const dossier = dossiers.find(d => d.id === id);
      if (window.confirm(`Êtes-vous sûr de vouloir supprimer le dossier ${dossier?.numero} ?`)) {
        setDossiers(prev => prev.filter(d => d.id !== id));
        toast({
          variant: 'default',
          title: 'Dossier supprimé',
          description: `Le dossier ${dossier?.numero} a été supprimé.`,
        });
      }
    },
    [dossiers, toast]
  );

  const exportData = useCallback(() => {
    // Export CSV
    const headers = ['Numéro', 'Titre', 'Client', 'Type', 'Statut', 'Date ouverture'];
    const rows = filteredDossiers.map(d => [
      d.numero,
      d.titre,
      d.clientNom,
      TYPE_LABELS[d.type],
      STATUT_LABELS[d.statut],
      d.dateOuverture,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dossiers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      variant: 'success',
      title: 'Export réussi',
      description: `${filteredDossiers.length} dossier(s) exporté(s) en CSV.`,
    });
  }, [filteredDossiers, toast]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Simulate API refresh
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        variant: 'success',
        title: 'Données actualisées',
        description: 'La liste des dossiers a été mise à jour.',
      });
    }, 500);
  }, [toast]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setTypeFilter('ALL');
    setStatutFilter('ALL');
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = searchTerm || typeFilter !== 'ALL' || statutFilter !== 'ALL';

  const handleRowClick = useCallback(
    (dossier: Dossier) => {
      router.push(`/dossiers/${dossier.id}`);
    },
    [router]
  );

  const handleClientClick = useCallback(
    (e: React.MouseEvent, clientId: string) => {
      e.stopPropagation();
      router.push(`/clients/${clientId}`);
    },
    [router]
  );

  const columns = useMemo(
    () => [
      { key: 'numero', header: 'Numéro' },
      { key: 'titre', header: 'Titre' },
      {
        key: 'clientNom',
        header: 'Client',
        render: (row: Dossier) => (
          <button
            onClick={e => handleClientClick(e, row.clientId)}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-medium transition-colors"
            title={`Voir le profil de ${row.clientNom}`}
          >
            {row.clientNom}
          </button>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        render: (row: Dossier) => (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded">
            {TYPE_LABELS[row.type]}
          </span>
        ),
      },
      {
        key: 'statut',
        header: 'Statut',
        render: (row: Dossier) => (
          <Badge variant={STATUT_COLORS[row.statut]}>{STATUT_LABELS[row.statut]}</Badge>
        ),
      },
      {
        key: 'dateOuverture',
        header: 'Date ouverture',
        render: (row: Dossier) => (
          <span className="text-gray-600 dark:text-gray-400">
            {new Date(row.dateOuverture).toLocaleDateString('fr-FR')}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row: Dossier) => (
          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => router.push(`/dossiers/${row.id}`)}
              className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/30 rounded transition-colors"
              title="Consulter le dossier"
              aria-label={`Consulter le dossier ${row.numero}`}
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => openEditModal(row)}
              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 rounded transition-colors"
              title="Modifier le dossier"
              aria-label={`Modifier le dossier ${row.numero}`}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => deleteDossier(row.id)}
              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Supprimer le dossier"
              aria-label={`Supprimer le dossier ${row.numero}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [router, openEditModal, deleteDossier, handleClientClick]
  );

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Dossiers' }]} />

      {/* Header avec gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="w-8 h-8" />
              Gestion des dossiers
            </h1>
            <p className="text-indigo-100 mt-2 max-w-lg">
              {stats.total} dossier(s) dont {stats.enCours} en cours - Suivez l&apos;avancement de
              vos affaires
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg hover:bg-white/30 disabled:opacity-50 transition-colors"
              title="Actualiser la liste"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
            <button
              onClick={exportData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg hover:bg-white/30"
            >
              <Download className="w-4 h-4" />
              Exporter
            </button>
            <a
              href="/dossiers/nouveau"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-700 rounded-lg hover:bg-indigo-50 font-medium shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Nouveau dossier
            </a>
          </div>
        </div>
      </div>

      {/* Stats avec icônes distinctes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="transform hover:scale-105 transition-transform duration-300">
          <StatCard
            title="Total dossiers"
            value={stats.total}
            icon={FileText}
            trend={{ value: 12, isPositive: true }}
          />
        </div>
        <div className="transform hover:scale-105 transition-transform duration-300">
          <StatCard title="En cours" value={stats.enCours} icon={Clock} />
        </div>
        <div className="transform hover:scale-105 transition-transform duration-300">
          <StatCard title="En attente" value={stats.enAttente} icon={AlertCircle} />
        </div>
        <div className="transform hover:scale-105 transition-transform duration-300">
          <StatCard title="Clos" value={stats.clos} icon={CheckCircle} />
        </div>
      </div>

      {/* Timeline des échéances à venir */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Échéances à venir
          </h2>
          <span className="text-sm text-gray-500">Prochains 7 jours</span>
        </div>
        <div className="space-y-3">
          {dossiers
            .filter(d => d.statut === 'EN_COURS')
            .slice(0, 3)
            .map((dossier, index) => (
              <div
                key={dossier.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors cursor-pointer"
                onClick={() => router.push(`/dossiers/${dossier.id}`)}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index === 0
                      ? 'bg-red-100 text-red-600'
                      : index === 1
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-yellow-100 text-yellow-600'
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{dossier.titre}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {dossier.numero} - {dossier.clientNom}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(dossier.dateOuverture).toLocaleDateString('fr-FR')}
                  </p>
                  <Badge variant={index === 0 ? 'danger' : index === 1 ? 'warning' : 'info'}>
                    {index === 0 ? 'Urgent' : index === 1 ? 'Cette semaine' : 'Bientôt'}
                  </Badge>
                </div>
              </div>
            ))}
          {dossiers.filter(d => d.statut === 'EN_COURS').length === 0 && (
            <p className="text-center text-gray-500 py-4">Aucune échéance à venir</p>
          )}
        </div>
      </Card>

      {/* Filters - Using specialized components to prevent hydration mismatch from browser extensions */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              placeholder="Rechercher par numéro, titre ou client..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              onClear={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              aria-label="Rechercher des dossiers"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400 hidden sm:block" aria-hidden="true" />
              <FilterSelect
                value={typeFilter}
                onChange={e => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={TYPE_OPTIONS.slice(1)} // Remove first "ALL" option since we use placeholder
                placeholder="Tous les types"
                label="Filtrer par type"
              />
              <FilterSelect
                value={statutFilter}
                onChange={e => {
                  setStatutFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={STATUT_OPTIONS.slice(1)}
                placeholder="Tous les statuts"
                label="Filtrer par statut"
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Effacer tous les filtres"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        </div>
        {hasActiveFilters && (
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {filteredDossiers.length} résultat{filteredDossiers.length > 1 ? 's' : ''} trouvé
              {filteredDossiers.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </Card>

      {/* Table */}
      <Card>
        <Table columns={columns} data={paginatedDossiers} onRowClick={handleRowClick} />
        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredDossiers.length}
            />
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDossier ? 'Modifier le dossier' : 'Creer un dossier'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Numero *
              </label>
              <input
                {...register('numero')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              {errors.numero && (
                <p className="mt-1 text-sm text-red-600">{errors.numero.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Client *
              </label>
              <select
                {...register('clientId')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Selectionner un client</option>
                {MOCK_CLIENTS.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.nom}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="mt-1 text-sm text-red-600">{errors.clientId.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre *
            </label>
            <input
              {...register('titre')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            {errors.titre && <p className="mt-1 text-sm text-red-600">{errors.titre.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type *
              </label>
              <select
                {...register('type')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Statut *
              </label>
              <select
                {...register('statut')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {Object.entries(STATUT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date d'ouverture *
              </label>
              <input
                type="date"
                {...register('dateOuverture')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              {errors.dateOuverture && (
                <p className="mt-1 text-sm text-red-600">{errors.dateOuverture.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de cloture
              </label>
              <input
                type="date"
                {...register('dateCloture')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingDossier ? 'Modifier' : 'Creer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
