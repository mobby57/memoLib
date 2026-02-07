'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader, ChevronLeft, Save } from 'lucide-react';

interface DossierDetail {
  id: string;
  numero: string;
  clientId: string;
  statut: string;
  description?: string;
  createdAt: string;
  documents: any[];
  deadlines: any[];
  messages: any[];
  invoices: any[];
}

export default function DossierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [dossier, setDossier] = useState<DossierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    statut: '',
    description: '',
  });

  const dossierId = params.id as string;

  useEffect(() => {
    fetchDossier();
  }, [dossierId]);

  async function fetchDossier() {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/dossiers/${dossierId}`);
      const data = await response.json();
      setDossier(data.data);
      setFormData({
        statut: data.data.statut,
        description: data.data.description || '',
      });
    } catch (error) {
      console.error('Failed to fetch dossier:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      const response = await fetch(`/api/v1/dossiers/${dossierId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setDossier(data.data);
        setEditing(false);
      }
    } catch (error) {
      console.error('Failed to update dossier:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!dossier) {
    return <div className="text-center py-12">Dossier non trouvé</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{dossier.numero}</h1>
          <p className="text-slate-600">Numéro de dossier</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div>
            <p className="text-sm text-slate-600">Client ID</p>
            <p className="text-lg font-semibold text-slate-900">{dossier.clientId}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Statut</p>
            <p className="text-lg font-semibold text-slate-900">{dossier.statut}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Date de création</p>
            <p className="text-lg font-semibold text-slate-900">
              {new Date(dossier.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Statut</label>
              <select
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg"
              >
                <option value="open">Ouvert</option>
                <option value="pending">En attente</option>
                <option value="closed">Closé</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <Save size={16} className="mr-2" />
                Enregistrer
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditing(false)}
              >
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setEditing(true)}>
            Modifier
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="documents" className="bg-white rounded-lg border border-slate-200 p-6">
        <TabsList>
          <TabsTrigger value="documents">Documents ({dossier.documents?.length || 0})</TabsTrigger>
          <TabsTrigger value="deadlines">Délais ({dossier.deadlines?.length || 0})</TabsTrigger>
          <TabsTrigger value="messages">Messages ({dossier.messages?.length || 0})</TabsTrigger>
          <TabsTrigger value="invoices">Factures ({dossier.invoices?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-4">
          {dossier.documents?.length ? (
            <div className="space-y-2">
              {dossier.documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-sm text-slate-600">{doc.category}</p>
                  </div>
                  <Button variant="ghost" size="sm">Télécharger</Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600">Aucun document</p>
          )}
        </TabsContent>

        <TabsContent value="deadlines" className="mt-4">
          {dossier.deadlines?.length ? (
            <div className="space-y-2">
              {dossier.deadlines.map((deadline: any) => (
                <div key={deadline.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">{deadline.type}</p>
                    <p className="text-sm text-slate-600">{new Date(deadline.dueDate).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600">Aucun délai</p>
          )}
        </TabsContent>

        <TabsContent value="messages" className="mt-4">
          <p className="text-slate-600">Section messages</p>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <p className="text-slate-600">Section factures</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
