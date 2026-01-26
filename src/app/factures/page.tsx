'use client';

// Force dynamic to prevent prerendering errors with useSession hook
export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Edit2, Trash2, Download, Send, FileText, Euro, Clock, CheckCircle, Eye, RefreshCw, CreditCard } from 'lucide-react';
import { Card, StatCard, Badge, Pagination, Breadcrumb, Alert, useToast } from '@/components/ui';
import { Table } from '@/components/ui/TableSimple';
import { Modal } from '@/components/forms/Modal';
import { Button } from '@/components/forms';
import { PDFExport } from '@/components/PDFExport';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface Facture {
  id: string;
  numero: string;
  client: string;
  dossier?: string;
  montantHT: number;
  montantTTC: number;
  statut: 'brouillon' | 'envoyee' | 'payee' | 'en_retard' | 'annulee';
  dateEmission: string;
  dateEcheance: string;
  datePaiement?: string;
}

const factureSchema = z.object({
  numero: z.string().min(1, 'Numero requis'),
  client: z.string().min(1, 'Client requis'),
  dossier: z.string().optional(),
  montantHT: z.string().min(1, 'Montant HT requis'),
  tauxTVA: z.string().min(1, 'Taux TVA requis'),
  statut: z.enum(['brouillon', 'envoyee', 'payee', 'en_retard', 'annulee']),
  dateEmission: z.string().min(1, 'Date d\'emission requise'),
  dateEcheance: z.string().min(1, 'Date d\'echeance requise'),
  datePaiement: z.string().optional(),
});

type FactureFormData = z.infer<typeof factureSchema>;

const mockFactures: Facture[] = [
  { id: '1', numero: 'FACT-2024-001', client: 'SARL Martin', dossier: 'DOS-2024-001', montantHT: 1500, montantTTC: 1800, statut: 'payee', dateEmission: '2024-01-05', dateEcheance: '2024-02-05', datePaiement: '2024-01-28' },
  { id: '2', numero: 'FACT-2024-002', client: 'SAS TechCorp', dossier: 'DOS-2024-002', montantHT: 2200, montantTTC: 2640, statut: 'envoyee', dateEmission: '2024-01-10', dateEcheance: '2024-02-10' },
  { id: '3', numero: 'FACT-2024-003', client: 'EURL Dupont', montantHT: 850, montantTTC: 1020, statut: 'brouillon', dateEmission: '2024-01-15', dateEcheance: '2024-02-15' },
  { id: '4', numero: 'FACT-2024-004', client: 'SCI Investissement', dossier: 'DOS-2024-004', montantHT: 3500, montantTTC: 4200, statut: 'en_retard', dateEmission: '2023-12-20', dateEcheance: '2024-01-20' },
  { id: '5', numero: 'FACT-2023-125', client: 'M. Bernard', dossier: 'DOS-2023-125', montantHT: 1200, montantTTC: 1440, statut: 'payee', dateEmission: '2023-12-01', dateEcheance: '2024-01-01', datePaiement: '2023-12-28' },
  { id: '6', numero: 'FACT-2024-005', client: 'SARL Dubois', montantHT: 1800, montantTTC: 2160, statut: 'envoyee', dateEmission: '2024-01-12', dateEcheance: '2024-02-12' },
  { id: '7', numero: 'FACT-2024-006', client: 'Entreprise ABC', dossier: 'DOS-2024-006', montantHT: 2500, montantTTC: 3000, statut: 'brouillon', dateEmission: '2024-01-18', dateEcheance: '2024-02-18' },
  { id: '8', numero: 'FACT-2024-007', client: 'Client XYZ', montantHT: 950, montantTTC: 1140, statut: 'payee', dateEmission: '2024-01-08', dateEcheance: '2024-02-08', datePaiement: '2024-02-05' },
];

const STATUT_LABELS = {
  brouillon: 'Brouillon',
  envoyee: 'Envoyee',
  payee: 'Payee',
  en_retard: 'En retard',
  annulee: 'Annulee',
};

const STATUT_COLORS: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  brouillon: 'default',
  envoyee: 'info',
  payee: 'success',
  en_retard: 'danger',
  annulee: 'warning',
};

export default function FacturesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [factures, setFactures] = useState<Facture[]>(mockFactures);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFacture, setEditingFacture] = useState<Facture | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { addToast } = useToast();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FactureFormData>({
    resolver: zodResolver(factureSchema),
  });

  const montantHT = watch('montantHT');
  const tauxTVA = watch('tauxTVA');

  const calculerMontantTTC = () => {
    const ht = parseFloat(montantHT || '0');
    const tva = parseFloat(tauxTVA || '20');
    return (ht * (1 + tva / 100)).toFixed(2);
  };

  // Filtrage et recherche
  const filteredFactures = useMemo(() => {
    return factures.filter(facture => {
      const matchSearch = 
        facture.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facture.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facture.dossier?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatut = filterStatut === 'all' || facture.statut === filterStatut;
      
      return matchSearch && matchStatut;
    });
  }, [factures, searchTerm, filterStatut]);

  // Pagination
  const totalPages = Math.ceil(filteredFactures.length / itemsPerPage);
  const paginatedFactures = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFactures.slice(start, start + itemsPerPage);
  }, [filteredFactures, currentPage]);

  // Statistiques
  const stats = useMemo(() => {
    const total = factures.reduce((sum, f) => sum + f.montantTTC, 0);
    const payees = factures.filter(f => f.statut === 'payee');
    const montantPaye = payees.reduce((sum, f) => sum + f.montantTTC, 0);
    const enAttente = factures.filter(f => f.statut === 'envoyee' || f.statut === 'brouillon');
    const montantEnAttente = enAttente.reduce((sum, f) => sum + f.montantTTC, 0);
    const enRetard = factures.filter(f => f.statut === 'en_retard').length;

    return {
      total,
      montantPaye,
      montantEnAttente,
      enRetard,
    };
  }, [factures]);

  const openCreateModal = () => {
    setEditingFacture(null);
    reset({
      numero: '',
      client: '',
      dossier: '',
      montantHT: '',
      tauxTVA: '20',
      statut: 'brouillon',
      dateEmission: new Date().toISOString().split('T')[0],
      dateEcheance: '',
      datePaiement: '',
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (facture: Facture) => {
    setEditingFacture(facture);
    reset({
      numero: facture.numero,
      client: facture.client,
      dossier: facture.dossier || '',
      montantHT: facture.montantHT.toString(),
      tauxTVA: '20',
      statut: facture.statut,
      dateEmission: facture.dateEmission,
      dateEcheance: facture.dateEcheance,
      datePaiement: facture.datePaiement || '',
    });
    setIsCreateModalOpen(true);
  };

  const onSubmit = (data: FactureFormData) => {
    const montantHT = parseFloat(data.montantHT);
    const tva = parseFloat(data.tauxTVA);
    const montantTTC = montantHT * (1 + tva / 100);

    if (editingFacture) {
      setFactures(prev =>
        prev.map(f =>
          f.id === editingFacture.id
            ? {
                ...f,
                ...data,
                montantHT,
                montantTTC,
              }
            : f
        )
      );
      addToast({
        variant: 'success',
        title: 'Facture modifiee',
        message: `La facture ${data.numero} a ete modifiee avec succes.`,
      });
    } else {
      const newFacture: Facture = {
        id: Date.now().toString(),
        ...data,
        montantHT,
        montantTTC,
      };
      setFactures(prev => [newFacture, ...prev]);
      addToast({
        variant: 'success',
        title: 'Facture creee',
        message: `La facture ${data.numero} a ete creee avec succes.`,
      });
    }
    setIsCreateModalOpen(false);
  };

  const deleteFacture = (id: string) => {
    const facture = factures.find(f => f.id === id);
    if (window.confirm(`etes-vous sur de vouloir supprimer la facture ${facture?.numero} ?`)) {
      setFactures(prev => prev.filter(f => f.id !== id));
      addToast({
        variant: 'info',
        title: 'Facture supprimee',
        message: `La facture ${facture?.numero} a ete supprimee.`,
      });
    }
  };

  const exportData = () => {
    // Export CSV functionality
    const headers = ['Numero', 'Client', 'Dossier', 'Montant HT', 'Montant TTC', 'Statut', 'Date Emission', 'Date Echeance'];
    const rows = filteredFactures.map(f => [
      f.numero,
      f.client,
      f.dossier || '',
      f.montantHT.toFixed(2),
      f.montantTTC.toFixed(2),
      STATUT_LABELS[f.statut],
      f.dateEmission,
      f.dateEcheance
    ]);
    
    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `factures_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    addToast({
      variant: 'success',
      title: 'Export termine',
      message: `${filteredFactures.length} facture(s) exportee(s) en CSV.`,
    });
  };

  const sendFacture = (facture: Facture) => {
    if (facture.statut === 'brouillon') {
      setFactures(prev =>
        prev.map(f =>
          f.id === facture.id ? { ...f, statut: 'envoyee' as const } : f
        )
      );
      addToast({
        variant: 'success',
        title: 'Facture envoyee',
        message: `La facture ${facture.numero} a ete envoyee au client.`,
      });
    }
  };

  const markAsPaid = (facture: Facture) => {
    if (facture.statut === 'envoyee' || facture.statut === 'en_retard') {
      setFactures(prev =>
        prev.map(f =>
          f.id === facture.id 
            ? { ...f, statut: 'payee' as const, datePaiement: new Date().toISOString().split('T')[0] } 
            : f
        )
      );
      addToast({
        variant: 'success',
        title: 'Paiement enregistre',
        message: `La facture ${facture.numero} a ete marquee comme payee.`,
      });
    }
  };

  const sendReminder = (facture: Facture) => {
    addToast({
      variant: 'info',
      title: 'Relance envoyee',
      message: `Une relance a ete envoyee pour la facture ${facture.numero}.`,
    });
  };

  const handleRowClick = (facture: Facture) => {
    router.push(`/factures/${facture.id}`);
  };

  const columns = [
    { accessor: 'numero' as const, header: 'Numero' },
    { accessor: 'client' as const, header: 'Client' },
    { accessor: 'dossier' as const, header: 'Dossier', render: (value: string | undefined) => value || '-' },
    { 
      accessor: 'montantHT' as const, 
      header: 'Montant HT',
      render: (value: number) => `${value.toFixed(2)} €`
    },
    { 
      accessor: 'montantTTC' as const, 
      header: 'Montant TTC',
      render: (value: number) => `${value.toFixed(2)} €`
    },
    {
      accessor: 'statut' as const,
      header: 'Statut',
      render: (value: 'brouillon' | 'envoyee' | 'payee' | 'en_retard' | 'annulee') => (
        <Badge variant={STATUT_COLORS[value]}>{STATUT_LABELS[value]}</Badge>
      ),
    },
    { accessor: 'dateEmission' as const, header: 'Date emission' },
    { accessor: 'dateEcheance' as const, header: 'Date echeance' },
    {
      accessor: 'id' as const,
      header: 'Actions',
      render: (_: string, row: Facture) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => router.push(`/factures/${row.id}`)}
            className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
            title="Consulter"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.statut === 'brouillon' && (
            <button
              onClick={() => sendFacture(row)}
              className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
              title="Envoyer"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
          {(row.statut === 'envoyee' || row.statut === 'en_retard') && (
            <button
              onClick={() => markAsPaid(row)}
              className="p-1 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
              title="Marquer comme payee"
            >
              <CreditCard className="w-4 h-4" />
            </button>
          )}
          {row.statut === 'en_retard' && (
            <button
              onClick={() => sendReminder(row)}
              className="p-1 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
              title="Envoyer une relance"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => openEditModal(row)}
            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            title="Modifier"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteFacture(row.id)}
            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

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
          { label: 'Factures' },
        ]}
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des factures</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerez vos factures et suivez les paiements
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
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nouvelle facture
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="CA Total"
          value={`${stats.total.toFixed(2)} €`}
          icon={Euro}
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Montant paye"
          value={`${stats.montantPaye.toFixed(2)} €`}
          icon={CheckCircle}
        />
        <StatCard
          title="En attente"
          value={`${stats.montantEnAttente.toFixed(2)} €`}
          icon={Clock}
        />
        <StatCard
          title="En retard"
          value={stats.enRetard}
          icon={FileText}
        />
      </div>

      {/* Alert */}
      {stats.enRetard > 0 && (
        <Alert variant="warning" title="Factures en retard">
          Vous avez {stats.enRetard} facture(s) en retard de paiement. Pensez a relancer vos clients.
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par numero, client ou dossier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
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
        {(searchTerm || filterStatut !== 'all') && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            {filteredFactures.length} resultat(s) trouve(s)
          </div>
        )}
      </Card>

      {/* Table */}
      <Card>
        <Table 
          columns={columns} 
          data={paginatedFactures} 
          onRowClick={handleRowClick}
        />
        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredFactures.length}
            />
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingFacture ? 'Modifier la facture' : 'Creer une facture'}
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
              <input
                {...register('client')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              {errors.client && (
                <p className="mt-1 text-sm text-red-600">{errors.client.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dossier associe
            </label>
            <input
              {...register('dossier')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Montant HT *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('montantHT')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              {errors.montantHT && (
                <p className="mt-1 text-sm text-red-600">{errors.montantHT.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                TVA (%)
              </label>
              <select
                {...register('tauxTVA')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="0">0%</option>
                <option value="5.5">5.5%</option>
                <option value="10">10%</option>
                <option value="20">20%</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Montant TTC
              </label>
              <input
                type="text"
                value={`${calculerMontantTTC()} €`}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date emission *
              </label>
              <input
                type="date"
                {...register('dateEmission')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              {errors.dateEmission && (
                <p className="mt-1 text-sm text-red-600">{errors.dateEmission.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date echeance *
              </label>
              <input
                type="date"
                {...register('dateEcheance')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              {errors.dateEcheance && (
                <p className="mt-1 text-sm text-red-600">{errors.dateEcheance.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date paiement
              </label>
              <input
                type="date"
                {...register('datePaiement')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
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
              {editingFacture ? 'Modifier' : 'Creer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
