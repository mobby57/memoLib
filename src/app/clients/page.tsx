'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Edit2, Trash2, Mail, Phone, Building2, User, Users, Eye } from 'lucide-react';
import { Card, StatCard, Badge, Pagination, Breadcrumb, Alert, useToast } from '@/components/ui';
import { Table } from '@/components/ui/TableSimple';
import { Modal } from '@/components/forms/Modal';
import { Button } from '@/components/forms';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface Client {
  id: string;
  nom: string;
  type: 'particulier' | 'entreprise';
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  codePostal: string;
  siret?: string;
  nbDossiers: number;
  dateCreation: string;
  statut: 'actif' | 'inactif' | 'prospect';
}

const clientSchema = z.object({
  nom: z.string().min(2, 'Nom requis (min 2 caracteres)'),
  type: z.enum(['particulier', 'entreprise']),
  email: z.string().email('Email invalide'),
  telephone: z.string().min(10, 'Telephone invalide'),
  adresse: z.string().min(5, 'Adresse requise'),
  ville: z.string().min(2, 'Ville requise'),
  codePostal: z.string().min(5, 'Code postal requis'),
  siret: z.string().optional(),
  statut: z.enum(['actif', 'inactif', 'prospect']),
});

type ClientFormData = z.infer<typeof clientSchema>;

const mockClients: Client[] = [
  { id: '1', nom: 'SARL Martin', type: 'entreprise', email: 'contact@sarl-martin.fr', telephone: '0145678901', adresse: '12 Rue de la Paix', ville: 'Paris', codePostal: '75001', siret: '12345678901234', nbDossiers: 3, dateCreation: '2023-06-15', statut: 'actif' },
  { id: '2', nom: 'SAS TechCorp', type: 'entreprise', email: 'info@techcorp.com', telephone: '0198765432', adresse: '45 Avenue des Champs', ville: 'Lyon', codePostal: '69001', siret: '98765432109876', nbDossiers: 5, dateCreation: '2023-08-20', statut: 'actif' },
  { id: '3', nom: 'M. Dupont Jean', type: 'particulier', email: 'jean.dupont@email.com', telephone: '0612345678', adresse: '8 Rue Victor Hugo', ville: 'Marseille', codePostal: '13001', nbDossiers: 1, dateCreation: '2024-01-10', statut: 'actif' },
  { id: '4', nom: 'SCI Investissement', type: 'entreprise', email: 'sci@invest.fr', telephone: '0478901234', adresse: '23 Boulevard Haussmann', ville: 'Paris', codePostal: '75009', siret: '11122233344455', nbDossiers: 2, dateCreation: '2023-11-05', statut: 'actif' },
  { id: '5', nom: 'Mme Bernard Sophie', type: 'particulier', email: 'sophie.bernard@mail.com', telephone: '0623456789', adresse: '15 Allee des Roses', ville: 'Toulouse', codePostal: '31000', nbDossiers: 1, dateCreation: '2023-12-01', statut: 'actif' },
  { id: '6', nom: 'EURL Conseil Plus', type: 'entreprise', email: 'contact@conseil-plus.fr', telephone: '0467890123', adresse: '7 Place Bellecour', ville: 'Lyon', codePostal: '69002', siret: '55566677788899', nbDossiers: 0, dateCreation: '2024-01-20', statut: 'prospect' },
  { id: '7', nom: 'M. Lefebvre Marc', type: 'particulier', email: 'marc.lefebvre@mail.fr', telephone: '0634567890', adresse: '22 Rue Nationale', ville: 'Lille', codePostal: '59000', nbDossiers: 2, dateCreation: '2023-10-12', statut: 'actif' },
  { id: '8', nom: 'SAS Innovation Tech', type: 'entreprise', email: 'contact@innovation-tech.fr', telephone: '0456789012', adresse: '88 Avenue de la Republique', ville: 'Bordeaux', codePostal: '33000', siret: '77788899900011', nbDossiers: 4, dateCreation: '2023-07-08', statut: 'actif' },
  { id: '9', nom: 'Mme Moreau Claire', type: 'particulier', email: 'claire.moreau@email.com', telephone: '0645678901', adresse: '5 Impasse du Parc', ville: 'Nantes', codePostal: '44000', nbDossiers: 0, dateCreation: '2024-01-15', statut: 'prospect' },
  { id: '10', nom: 'SARL Digital Services', type: 'entreprise', email: 'info@digital-services.fr', telephone: '0423456789', adresse: '31 Boulevard Saint-Michel', ville: 'Nice', codePostal: '06000', siret: '22233344455566', nbDossiers: 3, dateCreation: '2023-09-25', statut: 'actif' },
];

const STATUT_LABELS = {
  actif: 'Actif',
  inactif: 'Inactif',
  prospect: 'Prospect',
};

const STATUT_COLORS: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  actif: 'success',
  inactif: 'default',
  prospect: 'info',
};

const TYPE_LABELS = {
  particulier: 'Particulier',
  entreprise: 'Entreprise',
};

export default function ClientsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { addToast } = useToast();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  const clientType = watch('type');

  // Filtrage et recherche
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchSearch = 
        client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.ville.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchType = filterType === 'all' || client.type === filterType;
      const matchStatut = filterStatut === 'all' || client.statut === filterStatut;
      
      return matchSearch && matchType && matchStatut;
    });
  }, [clients, searchTerm, filterType, filterStatut]);

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(start, start + itemsPerPage);
  }, [filteredClients, currentPage]);

  // Statistiques
  const stats = useMemo(() => ({
    total: clients.length,
    actifs: clients.filter(c => c.statut === 'actif').length,
    entreprises: clients.filter(c => c.type === 'entreprise').length,
    prospects: clients.filter(c => c.statut === 'prospect').length,
  }), [clients]);

  const openCreateModal = () => {
    setEditingClient(null);
    reset({
      nom: '',
      type: 'particulier',
      email: '',
      telephone: '',
      adresse: '',
      ville: '',
      codePostal: '',
      siret: '',
      statut: 'prospect',
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    reset(client);
    setIsCreateModalOpen(true);
  };

  const onSubmit = (data: ClientFormData) => {
    if (editingClient) {
      setClients(prev =>
        prev.map(c =>
          c.id === editingClient.id
            ? { ...c, ...data }
            : c
        )
      );
      addToast({
        variant: 'success',
        title: 'Client modifie',
        message: `Le client ${data.nom} a ete modifie avec succes.`,
      });
    } else {
      const newClient: Client = {
        id: Date.now().toString(),
        ...data,
        nbDossiers: 0,
        dateCreation: new Date().toISOString().split('T')[0],
      };
      setClients(prev => [newClient, ...prev]);
      addToast({
        variant: 'success',
        title: 'Client cree',
        message: `Le client ${data.nom} a ete cree avec succes.`,
      });
    }
    setIsCreateModalOpen(false);
  };

  const deleteClient = (id: string) => {
    const client = clients.find(c => c.id === id);
    if (client && client.nbDossiers > 0) {
      addToast({
        variant: 'error',
        title: 'Suppression impossible',
        message: `Le client ${client.nom} a ${client.nbDossiers} dossier(s) associe(s).`,
      });
      return;
    }

    if (window.confirm(`etes-vous sur de vouloir supprimer le client ${client?.nom} ?`)) {
      setClients(prev => prev.filter(c => c.id !== id));
      addToast({
        variant: 'info',
        title: 'Client supprime',
        message: `Le client ${client?.nom} a ete supprime.`,
      });
    }
  };

  const columns = [
    { 
      accessor: 'nom' as const, 
      header: 'Nom',
      render: (value: string, row: Client) => (
        <div className="flex items-center gap-2">
          {row.type === 'entreprise' ? (
            <Building2 className="w-4 h-4 text-blue-500" />
          ) : (
            <User className="w-4 h-4 text-gray-500" />
          )}
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    { 
      accessor: 'type' as const, 
      header: 'Type',
      render: (value: 'particulier' | 'entreprise') => TYPE_LABELS[value]
    },
    {
      accessor: 'email' as const,
      header: 'Contact',
      render: (_: string, row: Client) => (
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <Mail className="w-3 h-3" />
            <span>{row.email}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <Phone className="w-3 h-3" />
            <span>{row.telephone}</span>
          </div>
        </div>
      ),
    },
    { 
      accessor: 'ville' as const, 
      header: 'Ville',
      render: (value: string, row: Client) => `${row.codePostal} ${value}`
    },
    {
      accessor: 'statut' as const,
      header: 'Statut',
      render: (value: 'actif' | 'inactif' | 'prospect') => (
        <Badge variant={STATUT_COLORS[value]}>{STATUT_LABELS[value]}</Badge>
      ),
    },
    { 
      accessor: 'nbDossiers' as const, 
      header: 'Dossiers',
      render: (value: number) => (
        <span className={value > 0 ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-400'}>
          {value}
        </span>
      )
    },
    { accessor: 'dateCreation' as const, header: 'Date creation' },
    {
      accessor: 'id' as const,
      header: 'Actions',
      render: (_: string, row: Client) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => router.push(`/clients/${row.id}`)}
            className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
            title="Consulter"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => openEditModal(row)}
            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            title="Modifier"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteClient(row.id)}
            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            title="Supprimer"
            disabled={row.nbDossiers > 0}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleRowClick = (client: Client) => {
    router.push(`/clients/${client.id}`);
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Clients' },
        ]}
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des clients</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerez votre portefeuille de clients
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nouveau client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total clients"
          value={stats.total}
          icon={Users}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Actifs"
          value={stats.actifs}
          icon={User}
        />
        <StatCard
          title="Entreprises"
          value={stats.entreprises}
          icon={Building2}
        />
        <StatCard
          title="Prospects"
          value={stats.prospects}
          icon={Users}
        />
      </div>

      {/* Alert */}
      {stats.prospects > 0 && (
        <Alert variant="info">
          Vous avez {stats.prospects} prospect(s) a convertir en clients actifs.
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Tous les types</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Tous les statuts</option>
              {Object.entries(STATUT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        {(searchTerm || filterType !== 'all' || filterStatut !== 'all') && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            {filteredClients.length} resultat(s) trouve(s)
          </div>
        )}
      </Card>

      {/* Table */}
      <Card>
        <Table 
          columns={columns} 
          data={paginatedClients} 
          onRowClick={handleRowClick}
        />
        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredClients.length}
            />
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingClient ? 'Modifier le client' : 'Creer un client'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom {clientType === 'entreprise' ? 'de l\'entreprise' : 'complet'} *
            </label>
            <input
              {...register('nom')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder={clientType === 'entreprise' ? 'SARL Dupont & Fils' : 'M. Dupont Jean'}
            />
            {errors.nom && (
              <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>
            )}
          </div>

          {clientType === 'entreprise' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SIRET
              </label>
              <input
                {...register('siret')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="12345678901234"
                maxLength={14}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telephone *
              </label>
              <input
                type="tel"
                {...register('telephone')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              {errors.telephone && (
                <p className="mt-1 text-sm text-red-600">{errors.telephone.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Adresse *
            </label>
            <input
              {...register('adresse')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            {errors.adresse && (
              <p className="mt-1 text-sm text-red-600">{errors.adresse.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ville *
              </label>
              <input
                {...register('ville')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              {errors.ville && (
                <p className="mt-1 text-sm text-red-600">{errors.ville.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Code postal *
              </label>
              <input
                {...register('codePostal')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                maxLength={5}
              />
              {errors.codePostal && (
                <p className="mt-1 text-sm text-red-600">{errors.codePostal.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingClient ? 'Modifier' : 'Creer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
