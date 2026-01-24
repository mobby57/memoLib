'use client';

import { useState, useMemo } from 'react';
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
import { FileText, Plus, Download, Search, Pencil, Trash2 } from 'lucide-react';

const dossierSchema = z.object({
  numero: z.string().min(1, 'Le numero est requis'),
  titre: z.string().min(3, 'Le titre doit contenir au moins 3 caracteres'),
  clientId: z.string().min(1, 'Le client est requis'),
  type: z.enum(['CIVIL', 'PENAL', 'COMMERCIAL', 'ADMINISTRATIF']),
  statut: z.enum(['EN_COURS', 'CLOS', 'EN_ATTENTE', 'ARCHIVE']),
  dateOuverture: z.string().min(1, 'La date d\'ouverture est requise'),
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
  ARCHIVE: 'Archive',
};

const STATUT_COLORS: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  EN_COURS: 'info',
  CLOS: 'success',
  EN_ATTENTE: 'warning',
  ARCHIVE: 'default',
};

export default function DossiersPage() {
  const [dossiers, setDossiers] = useState<Dossier[]>(MOCK_DOSSIERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDossier, setEditingDossier] = useState<Dossier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statutFilter, setStatutFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
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
  const stats = useMemo(() => ({
    total: dossiers.length,
    enCours: dossiers.filter(d => d.statut === 'EN_COURS').length,
    enAttente: dossiers.filter(d => d.statut === 'EN_ATTENTE').length,
    clos: dossiers.filter(d => d.statut === 'CLOS').length,
  }), [dossiers]);

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

  const deleteDossier = (id: string) => {
    const dossier = dossiers.find(d => d.id === id);
    if (window.confirm(`etes-vous sur de vouloir supprimer le dossier ${dossier?.numero} ?`)) {
      setDossiers(prev => prev.filter(d => d.id !== id));
      toast({
        variant: 'default',
        title: 'Dossier supprime',
        description: `Le dossier ${dossier?.numero} a ete supprime.`,
      });
    }
  };

  const exportData = () => {
    toast({
      variant: 'default',
      title: 'Export en cours',
      description: 'Votre fichier CSV sera telecharge dans quelques instants.',
    });
  };

  const columns = [
    { key: 'numero', header: 'Numero' },
    { key: 'titre', header: 'Titre' },
    { key: 'clientNom', header: 'Client' },
    { 
      key: 'type', 
      header: 'Type',
      render: (row: Dossier) => TYPE_LABELS[row.type]
    },
    {
      key: 'statut',
      header: 'Statut',
      render: (row: Dossier) => (
        <Badge variant={STATUT_COLORS[row.statut]}>{STATUT_LABELS[row.statut]}</Badge>
      ),
    },
    { key: 'dateOuverture', header: 'Date ouverture' },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: Dossier) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            title="Modifier"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteDossier(row.id)}
            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Dossiers' },
        ]}
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des dossiers</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerez vos dossiers juridiques et leur suivi
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
          <a
            href="/dossiers/nouveau"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nouveau dossier
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total dossiers"
          value={stats.total}
          icon={FileText}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="En cours"
          value={stats.enCours}
          icon={FileText}
        />
        <StatCard
          title="En attente"
          value={stats.enAttente}
          icon={FileText}
        />
        <StatCard
          title="Clos"
          value={stats.clos}
          icon={FileText}
        />
      </div>

      {/* Info Alert */}
      <Alert variant="info">
        Les dossiers archives ne sont pas inclus dans les statistiques actives ci-dessus.
      </Alert>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par numero, titre ou client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="ALL">Tous les types</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="ALL">Tous les statuts</option>
              {Object.entries(STATUT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        {(searchTerm || typeFilter !== 'ALL' || statutFilter !== 'ALL') && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            {filteredDossiers.length} resultat(s) trouve(s)
          </div>
        )}
      </Card>

      {/* Table */}
      <Card>
        <Table columns={columns} data={paginatedDossiers} />
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
                  <option key={client.id} value={client.id}>{client.nom}</option>
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
            {errors.titre && (
              <p className="mt-1 text-sm text-red-600">{errors.titre.message}</p>
            )}
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
                  <option key={value} value={value}>{label}</option>
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
                  <option key={value} value={value}>{label}</option>
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
