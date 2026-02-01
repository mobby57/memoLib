'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Folder, 
  Plus, 
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Video,
  Phone,
  Building,
  Edit,
  Trash2,
  Bell,
  Check,
  X
} from 'lucide-react';

interface RendezVous {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  type: string;
  status: string;
  user?: { name: string; email: string };
  client?: { firstName: string; lastName: string };
  dossier?: { numero: string; typeDossier: string };
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
}

interface Dossier {
  id: string;
  numero: string;
  typeDossier: string;
}

export default function RendezVousPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('week');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRdv, setSelectedRdv] = useState<RendezVous | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    startTime: '09:00',
    endTime: '10:00',
    type: 'rdv',
    clientId: '',
    dossierId: '',
    reminder: '60',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session?.user) {
      loadData();
    }
  }, [session, status, router, filter]);

  const loadData = async () => {
    if (!session?.user?.tenantId) return;
    
    setLoading(true);
    try {
      // Calculer les dates selon le filtre
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();
      
      switch (filter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          startDate.setDate(now.getDate() - now.getDay());
          endDate.setDate(startDate.getDate() + 7);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        default:
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          endDate = new Date(now.getFullYear() + 1, 11, 31);
      }

      const [eventsRes, clientsRes, dossiersRes] = await Promise.all([
        fetch(`/api/calendar?tenantId=${session.user.tenantId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&type=rdv`),
        fetch('/api/admin/clients'),
        fetch('/api/admin/dossiers'),
      ]);

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setRendezVous(data.events || []);
      }
      
      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data.clients || []);
      }
      
      if (dossiersRes.ok) {
        const data = await dossiersRes.json();
        setDossiers(data.dossiers || []);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.tenantId || !session?.user?.id) return;

    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.startDate}T${formData.endTime}`);

      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: session.user.tenantId,
          userId: session.user.id,
          title: formData.title,
          description: formData.description,
          location: formData.location,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          type: 'rdv',
          status: 'confirmed',
          clientId: formData.clientId || undefined,
          dossierId: formData.dossierId || undefined,
          reminders: formData.reminder ? [{ minutes: parseInt(formData.reminder), type: 'notification' }] : [],
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        resetForm();
        loadData();
      } else {
        alert('Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création RDV:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce rendez-vous ?')) return;
    
    try {
      const res = await fetch(`/api/calendar?eventId=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      type: 'rdv',
      clientId: '',
      dossierId: '',
      reminder: '60',
    });
    setSelectedRdv(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLocationIcon = (location?: string) => {
    if (!location) return <MapPin className="w-4 h-4" />;
    if (location.toLowerCase().includes('visio') || location.toLowerCase().includes('zoom') || location.toLowerCase().includes('teams')) {
      return <Video className="w-4 h-4 text-blue-500" />;
    }
    if (location.toLowerCase().includes('téléphone') || location.toLowerCase().includes('phone')) {
      return <Phone className="w-4 h-4 text-green-500" />;
    }
    return <Building className="w-4 h-4 text-gray-500" />;
  };

  const filteredRdv = rendezVous.filter(rdv => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      rdv.title.toLowerCase().includes(search) ||
      rdv.client?.firstName?.toLowerCase().includes(search) ||
      rdv.client?.lastName?.toLowerCase().includes(search) ||
      rdv.dossier?.numero?.toLowerCase().includes(search)
    );
  });

  // Grouper par date
  const groupedByDate = filteredRdv.reduce((acc, rdv) => {
    const dateKey = new Date(rdv.startDate).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(rdv);
    return acc;
  }, {} as Record<string, RendezVous[]>);

  const today = new Date().toDateString();
  const tomorrow = new Date(Date.now() + 86400000).toDateString();

  const getDateLabel = (dateStr: string) => {
    if (dateStr === today) return "Aujourd'hui";
    if (dateStr === tomorrow) return 'Demain';
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  Rendez-vous
                </h1>
                <p className="text-sm text-gray-500">
                  {filteredRdv.length} rendez-vous {filter === 'today' ? "aujourd'hui" : filter === 'week' ? 'cette semaine' : filter === 'month' ? 'ce mois' : 'au total'}
                </p>
              </div>
            </div>

            <button
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nouveau RDV
            </button>
          </div>
        </div>
      </header>

      {/* Filtres */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow-sm p-4 flex flex-wrap gap-4 items-center">
          {/* Recherche */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un RDV, client, dossier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtre période */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="today">Aujourd&apos;hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="all">Tous</option>
            </select>
          </div>

          {/* Toggle vue */}
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              Liste
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 ${view === 'calendar' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              Calendrier
            </button>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {view === 'list' ? (
          <div className="space-y-6">
            {Object.entries(groupedByDate).length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rendez-vous</h3>
                <p className="text-gray-500 mb-4">
                  Vous n&apos;avez pas de rendez-vous prévu pour cette période.
                </p>
                <button
                  onClick={() => { resetForm(); setIsModalOpen(true); }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-5 h-5" />
                  Planifier un rendez-vous
                </button>
              </div>
            ) : (
              Object.entries(groupedByDate)
                .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                .map(([dateStr, rdvs]) => (
                  <div key={dateStr}>
                    <h3 className={`text-sm font-semibold mb-3 ${dateStr === today ? 'text-blue-600' : 'text-gray-500'}`}>
                      {getDateLabel(dateStr)}
                    </h3>
                    <div className="space-y-3">
                      {rdvs.map((rdv) => (
                        <div
                          key={rdv.id}
                          className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow border-l-4 border-blue-500"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold text-gray-900">{rdv.title}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(rdv.status)}`}>
                                  {rdv.status === 'confirmed' ? 'Confirmé' : rdv.status === 'pending' ? 'En attente' : 'Annulé'}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {formatTime(rdv.startDate)} - {formatTime(rdv.endDate)}
                                </span>

                                {rdv.location && (
                                  <span className="flex items-center gap-1">
                                    {getLocationIcon(rdv.location)}
                                    {rdv.location}
                                  </span>
                                )}

                                {rdv.client && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    {rdv.client.firstName} {rdv.client.lastName}
                                  </span>
                                )}

                                {rdv.dossier && (
                                  <span className="flex items-center gap-1">
                                    <Folder className="w-4 h-4" />
                                    {rdv.dossier.numero}
                                  </span>
                                )}
                              </div>

                              {rdv.description && (
                                <p className="mt-2 text-sm text-gray-500">{rdv.description}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => { setSelectedRdv(rdv); setIsModalOpen(true); }}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(rdv.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Vue calendrier - 
                <Link href="/calendrier" className="text-blue-600 hover:underline ml-1">
                  Voir le calendrier complet
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Statistiques rapides */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {rendezVous.filter(r => r.status === 'confirmed').length}
                </p>
                <p className="text-sm text-gray-500">Confirmés</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {rendezVous.filter(r => r.status === 'pending').length}
                </p>
                <p className="text-sm text-gray-500">En attente</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {rendezVous.filter(r => new Date(r.startDate).toDateString() === today).length}
                </p>
                <p className="text-sm text-gray-500">Aujourd&apos;hui</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(rendezVous.map(r => r.client?.firstName).filter(Boolean)).size}
                </p>
                <p className="text-sm text-gray-500">Clients distincts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal création/édition */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {selectedRdv ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
              </h2>
              <button
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Consultation initiale"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Début
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fin
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lieu
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Cabinet, Visioconférence, Tribunal..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client
                  </label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.firstName} {client.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dossier
                  </label>
                  <select
                    value={formData.dossierId}
                    onChange={(e) => setFormData({ ...formData, dossierId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    {dossiers.map((dossier) => (
                      <option key={dossier.id} value={dossier.id}>
                        {dossier.numero} - {dossier.typeDossier}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Bell className="w-4 h-4 inline mr-1" />
                  Rappel
                </label>
                <select
                  value={formData.reminder}
                  onChange={(e) => setFormData({ ...formData, reminder: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Aucun rappel</option>
                  <option value="15">15 minutes avant</option>
                  <option value="30">30 minutes avant</option>
                  <option value="60">1 heure avant</option>
                  <option value="1440">1 jour avant</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Notes sur le rendez-vous..."
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {selectedRdv ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
