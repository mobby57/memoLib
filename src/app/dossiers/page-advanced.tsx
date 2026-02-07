'use client';

import React from 'react';
import { useState, useMemo } from 'react';
import { 
  Search, Plus, Pencil, Trash2, Filter, Download, Upload, FileText,
  Calendar, Clock, TrendingUp, Users, CheckSquare, BarChart3, 
  FileBarChart, Archive, Eye, MoreVertical, X, ChevronDown,
  ArrowUpDown, Columns, Grid3x3, List, SlidersHorizontal
} from 'lucide-react';
import { Card, StatCard, Table, Badge, Pagination, Breadcrumb, Alert, useToast } from '@/components/ui';
import { Modal } from '@/components/forms';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const dossierSchema = z.object({
  numero: z.string().min(1, 'Le numero est requis'),
  titre: z.string().min(3, 'Le titre doit contenir au moins 3 caracteres'),
  clientId: z.string().min(1, 'Le client est requis'),
  type: z.enum(['CIVIL', 'PENAL', 'COMMERCIAL', 'ADMINISTRATIF']),
  statut: z.enum(['EN_COURS', 'CLOS', 'EN_ATTENTE', 'ARCHIVE']),
  priorite: z.enum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']).default('NORMALE'),
  dateOuverture: z.string().min(1, 'La date d\'ouverture est requise'),
  dateCloture: z.string().optional(),
  description: z.string().optional(),
  montant: z.number().optional(),
  avocat: z.string().optional(),
});

type DossierFormData = z.infer<typeof dossierSchema>;

interface Dossier extends DossierFormData {
  id: string;
  clientNom: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  documents?: number;
  prochainRdv?: string;
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
    priorite: 'HAUTE',
    dateOuverture: '2024-01-15',
    description: 'Litige avec fournisseur sur qualite marchandise',
    montant: 150000,
    avocat: 'Me. Rousseau',
    documents: 12,
    tags: ['litige', 'commercial', 'urgent'],
    prochainRdv: '2026-01-10',
    createdAt: '2024-01-15T10:00:00',
    updatedAt: '2026-01-01T15:30:00',
  },
  {
    id: '2',
    numero: 'DOS-2024-002',
    titre: 'Divorce contentieux',
    clientId: '2',
    clientNom: 'Marie Martin',
    type: 'CIVIL',
    statut: 'EN_COURS',
    priorite: 'NORMALE',
    dateOuverture: '2024-02-20',
    montant: 0,
    avocat: 'Me. Dupont',
    documents: 8,
    tags: ['divorce', 'famille'],
    prochainRdv: '2026-01-15',
    createdAt: '2024-02-20T09:00:00',
    updatedAt: '2025-12-28T11:20:00',
  },
  {
    id: '3',
    numero: 'DOS-2024-003',
    titre: 'Contentieux administratif permis construire',
    clientId: '3',
    clientNom: 'SCI Investimo',
    type: 'ADMINISTRATIF',
    statut: 'EN_ATTENTE',
    priorite: 'BASSE',
    dateOuverture: '2024-03-10',
    montant: 50000,
    avocat: 'Me. Martin',
    documents: 25,
    tags: ['administratif', 'urbanisme'],
    createdAt: '2024-03-10T14:00:00',
    updatedAt: '2025-12-20T16:45:00',
  },
  {
    id: '4',
    numero: 'DOS-2023-045',
    titre: 'Defense penale - Vol',
    clientId: '4',
    clientNom: 'Thomas Bernard',
    type: 'PENAL',
    statut: 'CLOS',
    priorite: 'URGENTE',
    dateOuverture: '2023-11-05',
    dateCloture: '2024-01-20',
    montant: 0,
    avocat: 'Me. Rousseau',
    documents: 18,
    tags: ['penal', 'defense'],
    createdAt: '2023-11-05T08:30:00',
    updatedAt: '2024-01-20T17:00:00',
  },
  {
    id: '5',
    numero: 'DOS-2023-032',
    titre: 'Succession familiale',
    clientId: '5',
    clientNom: 'Sophie Dubois',
    type: 'CIVIL',
    statut: 'ARCHIVE',
    priorite: 'NORMALE',
    dateOuverture: '2023-09-12',
    dateCloture: '2023-12-30',
    montant: 200000,
    avocat: 'Me. Dupont',
    documents: 32,
    tags: ['succession', 'notaire'],
    createdAt: '2023-09-12T10:00:00',
    updatedAt: '2023-12-30T12:00:00',
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

const PRIORITE_LABELS = {
  BASSE: 'Basse',
  NORMALE: 'Normale',
  HAUTE: 'Haute',
  URGENTE: 'Urgente',
};

const STATUT_COLORS: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  EN_COURS: 'info',
  CLOS: 'success',
  EN_ATTENTE: 'warning',
  ARCHIVE: 'default',
};

const PRIORITE_COLORS: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  BASSE: 'default',
  NORMALE: 'info',
  HAUTE: 'warning',
  URGENTE: 'danger',
};

type ViewMode = 'table' | 'kanban' | 'calendar';

export default function DossiersAdvancedPage() {
  const [dossiers, setDossiers] = useState<Dossier[]>(MOCK_DOSSIERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDossier, setEditingDossier] = useState<Dossier | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  
  // Filtres avances
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statutFilter, setStatutFilter] = useState<string>('ALL');
  const [prioriteFilter, setPrioriteFilter] = useState<string>('ALL');
  const [avocatFilter, setAvocatFilter] = useState<string>('ALL');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Selection multiple
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Pagination et tri
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof Dossier>('dateOuverture');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DossierFormData>({
    resolver: zodResolver(dossierSchema) as any,
  });

  // Avocats uniques pour le filtre
  const avocats = useMemo(() => {
    const avocatsSet = new Set(dossiers.map(d => d.avocat).filter(Boolean));
    return Array.from(avocatsSet);
  }, [dossiers]);

  // Filtrage avance
  const filteredDossiers = useMemo(() => {
    return dossiers.filter(dossier => {
      const matchSearch = 
        dossier.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dossier.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dossier.clientNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dossier.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      
      const matchType = typeFilter === 'ALL' || dossier.type === typeFilter;
      const matchStatut = statutFilter === 'ALL' || dossier.statut === statutFilter;
      const matchPriorite = prioriteFilter === 'ALL' || dossier.priorite === prioriteFilter;
      const matchAvocat = avocatFilter === 'ALL' || dossier.avocat === avocatFilter;
      
      let matchDate = true;
      if (dateDebut && dateFin) {
        const dossierDate = new Date(dossier.dateOuverture);
        matchDate = dossierDate >= new Date(dateDebut) && dossierDate <= new Date(dateFin);
      }
      
      return matchSearch && matchType && matchStatut && matchPriorite && matchAvocat && matchDate;
    });
  }, [dossiers, searchTerm, typeFilter, statutFilter, prioriteFilter, avocatFilter, dateDebut, dateFin]);

  // Tri
  const sortedDossiers = useMemo(() => {
    return [...filteredDossiers].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredDossiers, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedDossiers.length / itemsPerPage);
  const paginatedDossiers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedDossiers.slice(start, start + itemsPerPage);
  }, [sortedDossiers, currentPage, itemsPerPage]);

  // Statistiques avancees
  const stats = useMemo(() => {
    const enCours = dossiers.filter(d => d.statut === 'EN_COURS');
    const totalMontant = dossiers.reduce((sum, d) => sum + (d.montant || 0), 0);
    
    return {
      total: dossiers.length,
      enCours: enCours.length,
      enAttente: dossiers.filter(d => d.statut === 'EN_ATTENTE').length,
      clos: dossiers.filter(d => d.statut === 'CLOS').length,
      urgents: dossiers.filter(d => d.priorite === 'URGENTE' && d.statut === 'EN_COURS').length,
      montantTotal: totalMontant,
      avgDocuments: Math.round(dossiers.reduce((sum, d) => sum + (d.documents || 0), 0) / dossiers.length),
    };
  }, [dossiers]);

  // Selection
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedDossiers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedDossiers.map(d => d.id)));
    }
  };

  // Actions en masse
  const bulkArchive = () => {
    if (selectedIds.size === 0) {
      addToast({ variant: 'warning', title: 'Aucune selection', message: 'Veuillez selectionner au moins un dossier.' });
      return;
    }
    
    setDossiers(prev =>
      prev.map(d => selectedIds.has(d.id) ? { ...d, statut: 'ARCHIVE' as const } : d)
    );
    addToast({
      variant: 'success',
      title: 'Archivage reussi',
      message: `${selectedIds.size} dossier(s) archive(s).`,
    });
    setSelectedIds(new Set());
  };

  const bulkChangeStatut = (newStatut: typeof STATUT_LABELS[keyof typeof STATUT_LABELS]) => {
    if (selectedIds.size === 0) return;
    
    setDossiers(prev =>
      prev.map(d => selectedIds.has(d.id) ? { ...d, statut: newStatut as any } : d)
    );
    addToast({
      variant: 'success',
      title: 'Statut modifie',
      message: `${selectedIds.size} dossier(s) mis a jour.`,
    });
    setSelectedIds(new Set());
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Numero', 'Titre', 'Client', 'Type', 'Statut', 'Priorite', 'Date Ouverture', 'Montant', 'Avocat'].join(','),
      ...filteredDossiers.map(d =>
        [d.numero, d.titre, d.clientNom, d.type, d.statut, d.priorite, d.dateOuverture, d.montant || 0, d.avocat || ''].join(',')
      ),
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dossiers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    addToast({
      variant: 'success',
      title: 'Export reussi',
      message: `${filteredDossiers.length} dossiers exportes en CSV.`,
    });
  };

  const exportToPDF = () => {
    addToast({
      variant: 'info',
      title: 'Export PDF',
      message: 'Generation du PDF en cours...',
    });
  };

  const openCreateModal = () => {
    setEditingDossier(null);
    reset({
      numero: '',
      titre: '',
      clientId: '',
      type: 'CIVIL',
      statut: 'EN_COURS',
      priorite: 'NORMALE',
      dateOuverture: new Date().toISOString().split('T')[0],
      description: '',
      montant: 0,
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
                updatedAt: new Date().toISOString(),
              }
            : d
        )
      );
      addToast({
        variant: 'success',
        title: 'Dossier modifie',
        message: `Le dossier ${data.numero} a ete modifie avec succes.`,
      });
    } else {
      const newDossier: Dossier = {
        ...data,
        id: Date.now().toString(),
        clientNom: MOCK_CLIENTS.find(c => c.id === data.clientId)?.nom || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        documents: 0,
        tags: [],
      };
      setDossiers(prev => [newDossier, ...prev]);
      addToast({
        variant: 'success',
        title: 'Dossier cree',
        message: `Le dossier ${data.numero} a ete cree avec succes.`,
      });
    }
    setIsModalOpen(false);
  };

  const deleteDossier = (id: string) => {
    const dossier = dossiers.find(d => d.id === id);
    if (window.confirm(`etes-vous sur de vouloir supprimer le dossier ${dossier?.numero} ?`)) {
      setDossiers(prev => prev.filter(d => d.id !== id));
      addToast({
        variant: 'info',
        title: 'Dossier supprime',
        message: `Le dossier ${dossier?.numero} a ete supprime.`,
      });
    }
  };

  const handleSort = (field: keyof Dossier) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('ALL');
    setStatutFilter('ALL');
    setPrioriteFilter('ALL');
    setAvocatFilter('ALL');
    setDateDebut('');
    setDateFin('');
    setSelectedIds(new Set());
  };

  const columns = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={selectedIds.size === paginatedDossiers.length && paginatedDossiers.length > 0}
          onChange={toggleSelectAll}
          className="rounded border-gray-300 dark:border-gray-600"
        />
      ),
      render: (row: Dossier) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={() => toggleSelection(row.id)}
          className="rounded border-gray-300 dark:border-gray-600"
        />
      ),
    },
    { 
      key: 'numero', 
      header: (
        <button onClick={() => handleSort('numero')} className="flex items-center gap-1 font-semibold hover:text-blue-600">
          Numero <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
    },
    { 
      key: 'titre', 
      header: (
        <button onClick={() => handleSort('titre')} className="flex items-center gap-1 font-semibold hover:text-blue-600">
          Titre <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
    },
    { key: 'clientNom', header: 'Client' },
    { 
      key: 'type', 
      header: 'Type',
      render: (row: Dossier) => (
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded">
          {TYPE_LABELS[row.type]}
        </span>
      )
    },
    {
      key: 'priorite',
      header: 'Priorite',
      render: (row: Dossier) => (
        <Badge variant={PRIORITE_COLORS[row.priorite]}>{PRIORITE_LABELS[row.priorite]}</Badge>
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
      header: (
        <button onClick={() => handleSort('dateOuverture')} className="flex items-center gap-1 font-semibold hover:text-blue-600">
          Date <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
    },
    {
      key: 'montant',
      header: 'Montant',
      render: (row: Dossier) => row.montant ? `${row.montant.toLocaleString('fr-FR')} €` : '-',
    },
    {
      key: 'documents',
      header: 'Docs',
      render: (row: Dossier) => (
        <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
          <FileText className="w-3 h-3" />
          {row.documents || 0}
        </span>
      ),
    },
    { key: 'avocat', header: 'Avocat' },
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
          { label: 'Dossiers Avances' },
        ]}
      />

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion Avancee des Dossiers</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Outils professionnels pour la gestion complete de vos dossiers juridiques
          </p>
        </div>
        <div className="flex gap-2">
          {/* Vue modes */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}
              title="Vue tableau"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}
              title="Vue kanban"
            >
              <Columns className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded ${viewMode === 'calendar' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}
              title="Vue calendrier"
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={exportToPDF}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <FileBarChart className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nouveau dossier
          </button>
        </div>
      </div>

      {/* Statistiques avancees */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Dossiers"
          value={stats.total.toString()}
          icon={FileText}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="En Cours"
          value={stats.enCours.toString()}
          icon={Clock}
          variant="info"
        />
        <StatCard
          title="En Attente"
          value={stats.enAttente.toString()}
          icon={Calendar}
          variant="warning"
        />
        <StatCard
          title="Urgents"
          value={stats.urgents.toString()}
          icon={TrendingUp}
          variant="danger"
        />
        <StatCard
          title="Montant Total"
          value={`${(stats.montantTotal / 1000).toFixed(0)}K€`}
          icon={BarChart3}
          variant="success"
        />
        <StatCard
          title="Docs Moyens"
          value={stats.avgDocuments.toString()}
          icon={FileText}
        />
      </div>

      {/* Filtres et recherche avancee */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Barre de recherche principale */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par numero, titre, client, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg ${
                showAdvancedFilters 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtres avances
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </button>
            {(typeFilter !== 'ALL' || statutFilter !== 'ALL' || prioriteFilter !== 'ALL' || searchTerm) && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                <X className="w-4 h-4" />
                Effacer
              </button>
            )}
          </div>

          {/* Filtres avances */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="ALL">Tous les types</option>
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Statut
                </label>
                <select
                  value={statutFilter}
                  onChange={(e) => setStatutFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="ALL">Tous les statuts</option>
                  {Object.entries(STATUT_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priorite
                </label>
                <select
                  value={prioriteFilter}
                  onChange={(e) => setPrioriteFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="ALL">Toutes les priorites</option>
                  {Object.entries(PRIORITE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Avocat
                </label>
                <select
                  value={avocatFilter}
                  onChange={(e) => setAvocatFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="ALL">Tous les avocats</option>
                  {avocats.map(avocat => (
                    <option key={avocat} value={avocat}>{avocat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date debut
                </label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date fin
                </label>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Actions en masse */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedIds.size} dossier(s) selectionne(s)
              </span>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => bulkChangeStatut('EN_COURS')}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Marquer en cours
                </button>
                <button
                  onClick={() => bulkChangeStatut('CLOS')}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Cloturer
                </button>
                <button
                  onClick={bulkArchive}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  <Archive className="w-4 h-4 inline mr-1" />
                  Archiver
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Resultats */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {filteredDossiers.length} dossier(s) trouve(s)
        {filteredDossiers.length !== dossiers.length && ` sur ${dossiers.length} total`}
      </div>

      {/* Contenu selon le mode de vue */}
      {viewMode === 'table' && (
        <Card>
          <Table columns={columns} data={paginatedDossiers} />
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredDossiers.length}
              showFirstLast
            />
          </div>
        </Card>
      )}

      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(STATUT_LABELS).map(([key, label]) => (
            <Card key={key} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">{label}</h3>
                <Badge variant={STATUT_COLORS[key]}>
                  {sortedDossiers.filter(d => d.statut === key).length}
                </Badge>
              </div>
              <div className="space-y-3">
                {sortedDossiers
                  .filter(d => d.statut === key)
                  .map(dossier => (
                    <div
                      key={dossier.id}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => openEditModal(dossier)}
                    >
                      <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                        {dossier.numero}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {dossier.titre}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant={PRIORITE_COLORS[dossier.priorite]} size="sm">
                          {PRIORITE_LABELS[dossier.priorite]}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {dossier.clientNom}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {viewMode === 'calendar' && (
        <Card className="p-6">
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Vue Calendrier
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              La vue calendrier avec les audiences et echeances sera bientot disponible
            </p>
          </div>
        </Card>
      )}

      {/* Modal formulaire */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDossier ? 'Modifier le dossier' : 'Nouveau dossier'}
      >
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Numero *
              </label>
              <input
                {...register('numero')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="DOS-2024-001"
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
              placeholder="Titre du dossier"
            />
            {errors.titre && (
              <p className="mt-1 text-sm text-red-600">{errors.titre.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type *
              </label>
              <select
                {...register('type')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priorite *
              </label>
              <select
                {...register('priorite')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {Object.entries(PRIORITE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Statut *
              </label>
              <select
                {...register('statut')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {Object.entries(STATUT_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Montant (€)
              </label>
              <input
                type="number"
                {...register('montant', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Avocat assigne
              </label>
              <input
                {...register('avocat')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Me. Dupont"
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
              placeholder="Description du dossier..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
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
