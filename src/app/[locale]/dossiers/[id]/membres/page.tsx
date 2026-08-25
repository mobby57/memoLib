'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

/**
 * Gestion des accès d'un dossier — "Qui a accès à ce dossier ?"
 *
 * Permet au responsable / owner du dossier d'ajouter, modifier ou retirer
 * des DossierMember. S'appuie sur l'API /api/dossiers/[id]/members
 * (protégée par canAccessDossier) et /api/admin/team pour lister les
 * utilisateurs du cabinet pouvant être ajoutés.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, UserPlus, Trash2, Shield, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/forms/Button';
import { useToast } from '@/hooks/use-toast';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Propriétaire',
  RESPONSIBLE: 'Responsable',
  ATTORNEY: 'Avocat',
  COLLABORATOR: 'Collaborateur',
  VIEWER: 'Lecture seule',
};

const ROLE_OPTIONS = Object.keys(ROLE_LABELS);

interface DossierMember {
  userId: string;
  dossierId: string;
  role: string;
  createdAt: string;
  User: { id: string; name: string | null; email: string; role: string };
}

interface TeamUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export default function DossierMembresPage() {
  const params = useParams();
  const dossierId = params?.id as string;
  const router = useRouter();
  const { status } = useSession();
  const { toast } = useToast();

  const [members, setMembers] = useState<DossierMember[]>([]);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('COLLABORATOR');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [membersRes, usersRes] = await Promise.all([
        fetch(`/api/dossiers/${dossierId}/members`),
        fetch('/api/admin/team'),
      ]);

      if (membersRes.status === 404) {
        setError('Dossier introuvable ou accès refusé.');
        return;
      }
      if (!membersRes.ok) throw new Error('Erreur chargement des membres');

      const membersData = await membersRes.json();
      setMembers(membersData.members || []);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.members || usersData.users || []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [dossierId]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status === 'authenticated' && dossierId) {
      loadData();
    }
  }, [status, dossierId, loadData, router]);

  const availableUsers = users.filter(u => !members.some(m => m.userId === u.id));

  const handleAdd = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur ajout membre');

      toast({ title: 'Membre ajouté', variant: 'success' });
      setSelectedUserId('');
      await loadData();
    } catch (e) {
      toast({ title: 'Erreur', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur modification rôle');

      toast({ title: 'Rôle mis à jour', variant: 'success' });
      await loadData();
    } catch (e) {
      toast({ title: 'Erreur', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Retirer ce membre du dossier ?')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/members?userId=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur retrait membre');

      toast({ title: 'Membre retiré', variant: 'success' });
      await loadData();
    } catch (e) {
      toast({ title: 'Erreur', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <Button
          onClick={() => router.push(`/dossiers/${dossierId}`)}
          className="mb-4 bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Retour au dossier
        </Button>

        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
          <Shield className="text-blue-600" size={26} />
          Qui a accès à ce dossier ?
        </h1>
        <p className="text-gray-600 mb-6">
          Gérez les collaborateurs autorisés à consulter ou modifier ce dossier, en plus
          du responsable et des permissions globales du cabinet.
        </p>

        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200 text-red-700">{error}</Card>
        )}

        {!error && (
          <>
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <UserPlus className="text-blue-600" size={20} />
                Ajouter un membre
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choisir un collaborateur --</option>
                  {availableUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email} ({u.role})
                    </option>
                  ))}
                </select>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {ROLE_OPTIONS.map(role => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={handleAdd}
                  disabled={!selectedUserId || saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                >
                  Ajouter
                </Button>
              </div>
              {availableUsers.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Tous les membres du cabinet ont déjà accès à ce dossier.
                </p>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                Membres du dossier ({members.length})
              </h2>
              {members.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Aucun membre explicite. Seuls le responsable du dossier et les
                  administrateurs du cabinet y ont accès.
                </p>
              ) : (
                <div className="divide-y divide-gray-200">
                  {members.map(m => (
                    <div key={m.userId} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {m.User?.name || m.User?.email || m.userId}
                        </p>
                        <p className="text-sm text-gray-500">{m.User?.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={m.role}
                          onChange={e => handleRoleChange(m.userId, e.target.value)}
                          disabled={saving}
                          className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                        >
                          {ROLE_OPTIONS.map(role => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                        <Badge variant="default">{ROLE_LABELS[m.role] || m.role}</Badge>
                        <button
                          onClick={() => handleRemove(m.userId)}
                          disabled={saving}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                          title="Retirer du dossier"
                          aria-label={`Retirer ${m.User?.name || m.userId} du dossier`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
