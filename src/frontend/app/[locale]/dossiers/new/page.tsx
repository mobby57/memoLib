'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, ChevronLeft } from 'lucide-react';

export default function NewDossierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    numero: '',
    clientId: '',
    description: '',
    statut: 'open',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/v1/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/dossiers/${data.data.id}`);
      } else {
        alert('Erreur lors de la création du dossier');
      }
    } catch (error) {
      console.error('Failed to create dossier:', error);
      alert('Erreur lors de la création du dossier');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Nouveau Dossier</h1>
          <p className="text-slate-600">Créer un nouveau dossier juridique</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Numéro de dossier*
          </label>
          <Input
            type="text"
            value={formData.numero}
            onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
            placeholder="EX-2024-001"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Client ID*
          </label>
          <Input
            type="text"
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            placeholder="ID du client"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description du dossier..."
            rows={4}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Statut
          </label>
          <select
            value={formData.statut}
            onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
          >
            <option value="open">Ouvert</option>
            <option value="pending">En attente</option>
            <option value="closed">Closé</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-slate-200">
          <Button type="submit" disabled={loading}>
            <Plus size={16} className="mr-2" />
            {loading ? 'Création...' : 'Créer le dossier'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
