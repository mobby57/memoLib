import { useAuth } from '@/hooks/useAuth';
'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Building2,
  User,
  Users,
  Eye,
  Download,
  Grid,
  List,
  TrendingUp,
  MapPin,
  ChevronDown,
  ChevronRight,
  Shield,
  Briefcase,
  Heart,
  Globe,
  FileText,
} from 'lucide-react';
import { Card, StatCard, Badge, Pagination, Breadcrumb, Alert, useToast } from '@/components/ui';
import { Table } from '@/components/ui/TableSimple';
import { Modal } from '@/components/forms/Modal';
import { Button } from '@/components/forms';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Client {
  id: string;
  civilite: string;
  nom: string;
  prenom: string;
  email: string;
  telephonePrincipal: string;
  ville: string;
  codePostal: string;
  nationalite: string;
  titreSéjourActuel: string;
  nbDossiers: number;
  dateCreation: string;
  statut: 'actif' | 'inactif' | 'prospect';
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const clientSchema = z.object({
  // Identité
  civilite: z.enum(['M.', 'Mme', 'Autre']),
  nom: z.string().min(2, 'Nom requis (min 2 caractères)'),
  prenom: z.string().min(2, 'Prénom requis (min 2 caractères)'),
  nomNaissance: z.string().optional(),
  dateNaissance: z.string().min(1, 'Date de naissance requise'),
  lieuNaissance: z.string().min(2, 'Lieu de naissance requis'),
  paysNaissance: z.string().min(2, 'Pays de naissance requis'),
  nationalite: z.string().min(2, 'Nationalité requise'),
  autresNationalites: z.string().optional(),
  sexe: z.enum(['M', 'F', 'Autre']),
  numeroEtranger: z.string().optional(),
  numeroPasseport: z.string().optional(),
  dateExpirationPasseport: z.string().optional(),
  numeroCNI: z.string().optional(),

  // Contact
  email: z.string().email('Email invalide'),
  telephonePrincipal: z.string().min(10, 'Téléphone invalide'),
  telephoneSecondaire: z.string().optional(),
  adresseRue: z.string().min(5, 'Adresse requise'),
  adresseComplement: z.string().optional(),
  codePostal: z.string().min(5, 'Code postal requis'),
  ville: z.string().min(2, 'Ville requise'),
  pays: z.string().min(2, 'Pays requis'),
  contactUrgenceNom: z.string().optional(),
  contactUrgenceTelephone: z.string().optional(),
  contactUrgenceLien: z.enum(['conjoint', 'parent', 'ami', 'autre']).optional(),

  // Situation familiale
  situationFamiliale: z.enum(['celibataire', 'marie', 'pacse', 'concubinage', 'divorce', 'veuf']),
  dateMarriage: z.string().optional(),
  conjointNom: z.string().optional(),
  conjointNationalite: z.string().optional(),
  conjointEstFrancais: z.boolean().optional(),
  nombreEnfants: z.coerce.number().min(0).default(0),
  enfantsEnFrance: z.coerce.number().min(0).default(0),
  enfantsScolarises: z.boolean().optional(),

  // Situation professionnelle
  situationPro: z.enum(['CDI', 'CDD', 'interimaire', 'independant', 'sans_emploi', 'etudiant', 'retraite']),
  employeur: z.string().optional(),
  poste: z.string().optional(),
  revenuMensuelNet: z.coerce.number().min(0).optional(),
  dateDebutContrat: z.string().optional(),
  niveauFrancais: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
  diplomes: z.string().optional(),
  domaineProfessionnel: z.string().optional(),

  // Administration immigration
  dateArriveeFrance: z.string().optional(),
  modeEntree: z.enum(['visa', 'sans_visa', 'demandeur_asile']).optional(),
  titreSéjourActuel: z.string().optional(),
  numeroTitre: z.string().optional(),
  dateDelivranceTitre: z.string().optional(),
  dateExpirationTitre: z.string().optional(),
  prefectureRattachement: z.string().optional(),
  dernierRDVPrefecture: z.string().optional(),
  prochainRDVPrefecture: z.string().optional(),

  // RGPD / Legal
  consentementTraitement: z.literal(true, { errorMap: () => ({ message: 'Le consentement est obligatoire' }) }),
  sourceDossier: z.enum(['recommandation', 'internet', 'ancien_client', 'autre']).optional(),
  notes: z.string().optional(),

  // Statut interne
  statut: z.enum(['actif', 'inactif', 'prospect']),
});

type ClientFormData = z.infer<typeof clientSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

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

const CIVILITE_OPTIONS = ['M.', 'Mme', 'Autre'] as const;
const SEXE_OPTIONS = [
  { value: 'M', label: 'Masculin' },
  { value: 'F', label: 'Féminin' },
  { value: 'Autre', label: 'Autre' },
] as const;

const SITUATION_FAMILIALE_OPTIONS = [
  { value: 'celibataire', label: 'Célibataire' },
  { value: 'marie', label: 'Marié(e)' },
  { value: 'pacse', label: 'Pacsé(e)' },
  { value: 'concubinage', label: 'Concubinage' },
  { value: 'divorce', label: 'Divorcé(e)' },
  { value: 'veuf', label: 'Veuf/Veuve' },
] as const;

const SITUATION_PRO_OPTIONS = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'interimaire', label: 'Intérimaire' },
  { value: 'independant', label: 'Indépendant' },
  { value: 'sans_emploi', label: 'Sans emploi' },
  { value: 'etudiant', label: 'Étudiant' },
  { value: 'retraite', label: 'Retraité' },
] as const;

const NIVEAU_FRANCAIS_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

const MODE_ENTREE_OPTIONS = [
  { value: 'visa', label: 'Visa' },
  { value: 'sans_visa', label: 'Sans visa' },
  { value: 'demandeur_asile', label: 'Demandeur d\'asile' },
] as const;

const CONTACT_URGENCE_LIEN_OPTIONS = [
  { value: 'conjoint', label: 'Conjoint(e)' },
  { value: 'parent', label: 'Parent' },
  { value: 'ami', label: 'Ami(e)' },
  { value: 'autre', label: 'Autre' },
] as const;

const SOURCE_DOSSIER_OPTIONS = [
  { value: 'recommandation', label: 'Recommandation' },
  { value: 'internet', label: 'Internet' },
  { value: 'ancien_client', label: 'Ancien client' },
  { value: 'autre', label: 'Autre' },
] as const;

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockClients: Client[] = [
  {
    id: '1',
    civilite: 'M.',
    nom: 'Diallo',
    prenom: 'Mamadou',
    email: 'mamadou.diallo@email.com',
    telephonePrincipal: '0612345678',
    ville: 'Paris',
    codePostal: '75018',
    nationalite: 'Guinéenne',
    titreSéjourActuel: 'Titre de séjour salarié',
    nbDossiers: 3,
    dateCreation: '2023-06-15',
    statut: 'actif',
  },
  {
    id: '2',
    civilite: 'Mme',
    nom: 'Nguyen',
    prenom: 'Linh',
    email: 'linh.nguyen@email.com',
    telephonePrincipal: '0698765432',
    ville: 'Lyon',
    codePostal: '69003',
    nationalite: 'Vietnamienne',
    titreSéjourActuel: 'Carte de résident',
    nbDossiers: 2,
    dateCreation: '2023-08-20',
    statut: 'actif',
  },
  {
    id: '3',
    civilite: 'M.',
    nom: 'Hassan',
    prenom: 'Ahmed',
    email: 'ahmed.hassan@email.com',
    telephonePrincipal: '0634567890',
    ville: 'Marseille',
    codePostal: '13001',
    nationalite: 'Égyptienne',
    titreSéjourActuel: 'Récépissé',
    nbDossiers: 1,
    dateCreation: '2024-01-10',
    statut: 'actif',
  },
  {
    id: '4',
    civilite: 'Mme',
    nom: 'Fernandez',
    prenom: 'Maria',
    email: 'maria.fernandez@email.com',
    telephonePrincipal: '0645678901',
    ville: 'Toulouse',
    codePostal: '31000',
    nationalite: 'Colombienne',
    titreSéjourActuel: 'Vie privée et familiale',
    nbDossiers: 2,
    dateCreation: '2023-11-05',
    statut: 'actif',
  },
  {
    id: '5',
    civilite: 'M.',
    nom: 'Kouassi',
    prenom: 'Jean-Pierre',
    email: 'jp.kouassi@email.com',
    telephonePrincipal: '0656789012',
    ville: 'Bordeaux',
    codePostal: '33000',
    nationalite: 'Ivoirienne',
    titreSéjourActuel: '',
    nbDossiers: 1,
    dateCreation: '2023-12-01',
    statut: 'actif',
  },
  {
    id: '6',
    civilite: 'Mme',
    nom: 'Petrov',
    prenom: 'Natalia',
    email: 'natalia.petrov@email.com',
    telephonePrincipal: '0667890123',
    ville: 'Nice',
    codePostal: '06000',
    nationalite: 'Russe',
    titreSéjourActuel: 'Passeport talent',
    nbDossiers: 0,
    dateCreation: '2024-01-20',
    statut: 'prospect',
  },
  {
    id: '7',
    civilite: 'M.',
    nom: 'Singh',
    prenom: 'Rajesh',
    email: 'rajesh.singh@email.com',
    telephonePrincipal: '0678901234',
    ville: 'Lille',
    codePostal: '59000',
    nationalite: 'Indienne',
    titreSéjourActuel: 'Étudiant',
    nbDossiers: 1,
    dateCreation: '2023-10-12',
    statut: 'actif',
  },
  {
    id: '8',
    civilite: 'Mme',
    nom: 'Amara',
    prenom: 'Fatima',
    email: 'fatima.amara@email.com',
    telephonePrincipal: '0689012345',
    ville: 'Strasbourg',
    codePostal: '67000',
    nationalite: 'Algérienne',
    titreSéjourActuel: 'Carte de résident',
    nbDossiers: 4,
    dateCreation: '2023-07-08',
    statut: 'actif',
  },
  {
    id: '9',
    civilite: 'M.',
    nom: 'Chen',
    prenom: 'Wei',
    email: 'wei.chen@email.com',
    telephonePrincipal: '0690123456',
    ville: 'Nantes',
    codePostal: '44000',
    nationalite: 'Chinoise',
    titreSéjourActuel: '',
    nbDossiers: 0,
    dateCreation: '2024-01-15',
    statut: 'prospect',
  },
  {
    id: '10',
    civilite: 'M.',
    nom: 'Okafor',
    prenom: 'Emmanuel',
    email: 'emmanuel.okafor@email.com',
    telephonePrincipal: '0601234567',
    ville: 'Rennes',
    codePostal: '35000',
    nationalite: 'Nigériane',
    titreSéjourActuel: 'APS',
    nbDossiers: 2,
    dateCreation: '2023-09-25',
    statut: 'actif',
  },
];


// ─── Collapsible Section Component ────────────────────────────────────────────

function FormSection({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ElementType;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
          <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          {title}
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {isOpen && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

// ─── Field Wrapper ────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  children,
  className = '',
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';


// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClientsPage() {
  const router = useRouter();
  const { data: session, status, user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const itemsPerPage = 10;

  // Charger les clients depuis l'API
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.clients || data || []).map((c: any) => ({
          id: c.id,
          civilite: c.civilite || 'M.',
          nom: c.lastName || '',
          prenom: c.firstName || '',
          email: c.email || '',
          telephonePrincipal: c.phone || '',
          ville: c.ville || '',
          codePostal: c.codePostal || '',
          nationalite: c.nationality || 'Française',
          titreSéjourActuel: c.passportNumber || '',
          nbDossiers: c._count?.Dossier || c._count?.dossiers || 0,
          dateCreation: c.createdAt || new Date().toISOString(),
          statut: c.status || 'actif',
        }));
        setClients(mapped);
      } else {
        setClients([]);
      }
    } catch {
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Collapsible sections state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    identite: true,
    contact: true,
    situation: false,
    professionnel: false,
    immigration: false,
    rgpd: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const { addToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema) as any,
    defaultValues: {
      civilite: 'M.',
      sexe: 'M',
      situationFamiliale: 'celibataire',
      situationPro: 'sans_emploi',
      statut: 'prospect',
      nombreEnfants: 0,
      enfantsEnFrance: 0,
      conjointEstFrancais: false,
      enfantsScolarises: false,
      consentementTraitement: undefined,
      pays: 'France',
    },
  });

  const situationFamiliale = watch('situationFamiliale');

  // Filtrage et recherche
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchSearch =
        client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.nationalite.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatut = filterStatut === 'all' || client.statut === filterStatut;

      return matchSearch && matchStatut;
    });
  }, [clients, searchTerm, filterStatut]);

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(start, start + itemsPerPage);
  }, [filteredClients, currentPage]);

  // Statistiques
  const stats = useMemo(
    () => ({
      total: clients.length,
      actifs: clients.filter(c => c.statut === 'actif').length,
      prospects: clients.filter(c => c.statut === 'prospect').length,
      avecTitre: clients.filter(c => c.titreSéjourActuel && c.titreSéjourActuel.length > 0).length,
    }),
    [clients]
  );

  // Export CSV
  const exportToCSV = () => {
    const headers = ['Civilité', 'Nom', 'Prénom', 'Email', 'Téléphone', 'Ville', 'Nationalité', 'Titre de séjour', 'Dossiers', 'Statut', 'Date création'];
    const csvData = filteredClients.map(c => [
      c.civilite,
      c.nom,
      c.prenom,
      c.email,
      c.telephonePrincipal,
      `${c.codePostal} ${c.ville}`,
      c.nationalite,
      c.titreSéjourActuel || 'Aucun',
      c.nbDossiers.toString(),
      STATUT_LABELS[c.statut],
      c.dateCreation,
    ]);

    const csvContent = [headers.join(';'), ...csvData.map(row => row.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `clients_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    addToast({
      variant: 'success',
      title: 'Export réussi',
      message: `${filteredClients.length} client(s) exporté(s) au format CSV.`,
    });
  };

  const openCreateModal = () => {
    setEditingClient(null);
    reset({
      civilite: 'M.',
      nom: '',
      prenom: '',
      sexe: 'M',
      dateNaissance: '',
      lieuNaissance: '',
      paysNaissance: '',
      nationalite: '',
      email: '',
      telephonePrincipal: '',
      adresseRue: '',
      codePostal: '',
      ville: '',
      pays: 'France',
      situationFamiliale: 'celibataire',
      nombreEnfants: 0,
      enfantsEnFrance: 0,
      situationPro: 'sans_emploi',
      statut: 'prospect',
      consentementTraitement: undefined as unknown as true,
    });
    setOpenSections({
      identite: true,
      contact: true,
      situation: false,
      professionnel: false,
      immigration: false,
      rgpd: true,
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    reset({
      civilite: client.civilite as 'M.' | 'Mme' | 'Autre',
      nom: client.nom,
      prenom: client.prenom,
      sexe: 'M',
      dateNaissance: '',
      lieuNaissance: '',
      paysNaissance: '',
      nationalite: client.nationalite,
      email: client.email,
      telephonePrincipal: client.telephonePrincipal,
      adresseRue: '',
      codePostal: client.codePostal,
      ville: client.ville,
      pays: 'France',
      situationFamiliale: 'celibataire',
      nombreEnfants: 0,
      enfantsEnFrance: 0,
      situationPro: 'sans_emploi',
      titreSéjourActuel: client.titreSéjourActuel,
      statut: client.statut,
      consentementTraitement: true,
    });
    setOpenSections({
      identite: true,
      contact: true,
      situation: true,
      professionnel: true,
      immigration: true,
      rgpd: true,
    });
    setIsCreateModalOpen(true);
  };

  const onSubmit = async (data: ClientFormData) => {
    try {
      if (editingClient) {
        // EDIT: PATCH /api/clients/[id]
        const res = await fetch(`/api/clients/${editingClient.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            civilite: data.civilite,
            firstName: data.prenom,
            lastName: data.nom,
            email: data.email,
            phone: data.telephonePrincipal,
            ville: data.ville,
            codePostal: data.codePostal,
            nationality: data.nationalite,
            status: data.statut,
          }),
        });
        if (!res.ok) throw new Error('Erreur modification');
        addToast({
          variant: 'success',
          title: 'Client modifié',
          message: `Le client ${data.prenom} ${data.nom} a été modifié avec succès.`,
        });
      } else {
        // CREATE: POST /api/clients
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            civilite: data.civilite,
            firstName: data.prenom,
            lastName: data.nom,
            email: data.email,
            phone: data.telephonePrincipal,
            ville: data.ville,
            codePostal: data.codePostal,
            nationality: data.nationalite,
            status: data.statut,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Erreur création');
        }
        addToast({
          variant: 'success',
          title: 'Client créé',
          message: `Le client ${data.prenom} ${data.nom} a été créé avec succès.`,
        });
      }
      setIsCreateModalOpen(false);
      await fetchClients(); // Recharger depuis l'API
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Erreur',
        message: error instanceof Error ? error.message : 'Une erreur est survenue.',
      });
    }
  };

  const deleteClient = async (id: string) => {
    const client = clients.find(c => c.id === id);
    if (client && client.nbDossiers > 0) {
      addToast({
        variant: 'error',
        title: 'Suppression impossible',
        message: `Le client ${client.prenom} ${client.nom} a ${client.nbDossiers} dossier(s) associé(s).`,
      });
      return;
    }
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${client?.civilite} ${client?.prenom} ${client?.nom} ?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur suppression');
      addToast({
        variant: 'info',
        title: 'Client supprimé',
        message: `Le client ${client?.prenom} ${client?.nom} a été supprimé.`,
      });
      await fetchClients();
    } catch {
      addToast({
        variant: 'error',
        title: 'Erreur',
        message: 'Impossible de supprimer ce client.',
      });
    }
  };

  const handleRowClick = (client: Client) => {
    router.push(`/clients/${client.id}`);
  };


  // Table columns
  const columns = [
    {
      accessor: 'nom' as const,
      header: 'Client',
      render: (_: string, row: Client) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <span className="font-medium text-gray-900 dark:text-white">
              {row.civilite} {row.prenom} {row.nom}
            </span>
            <div className="text-xs text-gray-500 dark:text-gray-400">{row.nationalite}</div>
          </div>
        </div>
      ),
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
            <span>{row.telephonePrincipal}</span>
          </div>
        </div>
      ),
    },
    {
      accessor: 'ville' as const,
      header: 'Ville',
      render: (value: string, row: Client) => (
        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="w-3 h-3" />
          <span>{row.codePostal} {value}</span>
        </div>
      ),
    },
    {
      accessor: 'titreSéjourActuel' as const,
      header: 'Titre de séjour',
      render: (value: string) => (
        <span className={`text-sm ${value ? 'text-gray-900 dark:text-white' : 'text-gray-400 italic'}`}>
          {value || 'Non renseigné'}
        </span>
      ),
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
      ),
    },
    { accessor: 'dateCreation' as const, header: 'Créé le' },
    {
      accessor: 'id' as const,
      header: 'Actions',
      render: (_: string, row: Client) => (
        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
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


  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 dark:text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Clients' }]} />

      {/* Header avec gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="w-8 h-8" />
              Gestion des clients
            </h1>
            <p className="text-blue-100 mt-2 max-w-lg">
              Gérez votre portefeuille de {stats.total} clients — Droit des étrangers (CESEDA)
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all border border-white/30"
              title="Exporter en CSV"
            >
              <Download className="w-4 h-4" />
              Exporter
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 font-medium transition-all shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Nouveau client
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="transform hover:scale-105 transition-transform duration-300">
          <StatCard
            title="Total clients"
            value={stats.total}
            icon={Users}
            trend={{ value: 8, isPositive: true }}
          />
        </div>
        <div className="transform hover:scale-105 transition-transform duration-300">
          <StatCard title="Actifs" value={stats.actifs} icon={User} />
        </div>
        <div className="transform hover:scale-105 transition-transform duration-300">
          <StatCard title="Avec titre de séjour" value={stats.avecTitre} icon={Globe} />
        </div>
        <div className="transform hover:scale-105 transition-transform duration-300">
          <StatCard title="Prospects" value={stats.prospects} icon={TrendingUp} />
        </div>
      </div>

      {/* Alert */}
      {stats.prospects > 0 && (
        <Alert variant="info">
          Vous avez {stats.prospects} prospect(s) à convertir en clients actifs.
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, email, ville, nationalité..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatut}
              onChange={e => setFilterStatut(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              {Object.entries(STATUT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title="Vue tableau"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 transition-colors ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title="Vue cartes"
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        {(searchTerm || filterStatut !== 'all') && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
              {filteredClients.length} résultat(s)
            </span>
            <button
              onClick={() => { setSearchTerm(''); setFilterStatut('all'); }}
              className="text-blue-600 hover:underline text-xs"
            >
              Réinitialiser
            </button>
          </div>
        )}
      </Card>


      {/* Table View */}
      {viewMode === 'table' && (
        <Card>
          <Table columns={columns} data={paginatedClients} onRowClick={handleRowClick} />
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
      )}

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedClients.map(client => (
            <div
              key={client.id}
              onClick={() => handleRowClick(client)}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700 group hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {client.civilite} {client.prenom} {client.nom}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {client.nationalite}
                    </span>
                  </div>
                </div>
                <Badge variant={STATUT_COLORS[client.statut]}>{STATUT_LABELS[client.statut]}</Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span>{client.telephonePrincipal}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{client.codePostal} {client.ville}</span>
                </div>
                {client.titreSéjourActuel && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Globe className="w-4 h-4" />
                    <span className="truncate">{client.titreSéjourActuel}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {client.nbDossiers} dossier(s)
                </span>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => openEditModal(client)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteClient(client.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    disabled={client.nbDossiers > 0}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination for cards view */}
      {viewMode === 'cards' && totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredClients.length}
          />
        </div>
      )}
    </div>
  );
}
