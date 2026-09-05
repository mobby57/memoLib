import { useAuth } from '@/hooks/useAuth';
'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

/**
 * Gestion des équipes du cabinet (Team).
 *
 * Liste/crée/renomme/supprime les équipes, backées par /api/teams.
 * La gestion des membres se fait sur la page de détail /admin/equipes/[id].
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Users, FolderKanban, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/forms/Button';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { TeamMember: number; Dossier: number };
}

export default function EquipesPage() {
  const router = useRouter();
  const { data: session, status, user } = useAuth();
  const { toast } = useToast();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch('/api/teams');
      if (!res.ok) throw new Error('Erreur chargement des équipes');
      const data = await res.json();
      setTeams(data.teams || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les équipes' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      fetchTeams();
    }
  }, [status, fetchTeams, router]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const url = editingId ? `/api/teams/${editingId}` : '/api/teams';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Erreur');
      }
      toast({ variant: 'success', title: editingId ? 'Équipe modifiée' : 'Équipe créée' });
      resetForm();
      fetchTeams();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: (error as Error).message });
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (team: Team) => {
    setEditingId(team.id);
    setName(team.name);
    setDescription(team.description || '');
  };

  const handleDelete = async (team: Team) => {
    if (!confirm(`Supprimer l'équipe "${team.name}" ? Les dossiers rattachés ne seront pas supprimés.`)) return;
    try {
      const res = await fetch(`/api/teams/${team.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Erreur suppression');
      }
      toast({ variant: 'success', title: 'Équipe supprimée' });
      fetchTeams();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: (error as Error).message });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="text-blue-600" size={32} />
            Équipes du cabinet
          </h1>
          <p className="text-gray-600 mt-2">
            Organisez vos collaborateurs par équipe (ex : Droit social, Contentieux...). Les dossiers rattachés à une
            équipe héritent des accès de ses membres.
          </p>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? "Modifier l'équipe" : 'Créer une équipe'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Droit des étrangers"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description optionnelle"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={creating || !name.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={18} />}
              {editingId ? 'Enregistrer' : 'Créer l\'équipe'}
            </Button>
            {editingId && (
              <Button onClick={resetForm} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
                Annuler
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Équipes existantes ({teams.length})</h2>
          {teams.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune équipe pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div>
                    <button
                      onClick={() => router.push(`/admin/equipes/${team.id}`)}
                      className="font-semibold text-gray-900 hover:text-blue-600 text-left"
                    >
                      {team.name}
                    </button>
                    {team.description && <p className="text-sm text-gray-500">{team.description}</p>}
                    <div className="flex gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users size={14} /> {team._count.TeamMember} membre(s)
                      </span>
                      <span className="flex items-center gap-1">
                        <FolderKanban size={14} /> {team._count.Dossier} dossier(s)
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => router.push(`/admin/equipes/${team.id}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Gérer les membres"
                    >
                      <Users size={18} />
                    </button>
                    <button
                      onClick={() => handleEdit(team)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Modifier"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(team)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
