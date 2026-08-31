'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

/**
 * Détail d'une équipe : liste/ajout/retrait de ses membres (TeamMember).
 *
 * S'appuie sur /api/teams/[id] (GET) et /api/teams/[id]/members (POST/DELETE),
 * et /api/admin/team pour lister les utilisateurs du cabinet pouvant être ajoutés.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, UserPlus, Trash2, Users, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/forms/Button';
import { useToast } from '@/hooks/use-toast';

const ROLE_LABELS: Record<string, string> = {
  TEAM_LEAD: "Responsable d'équipe",
  ATTORNEY: 'Avocat',
  COLLABORATOR: 'Collaborateur',
  ASSISTANT: 'Assistant',
  PARALEGAL: 'Juriste',
  MEMBER: 'Membre',
};

const ROLE_OPTIONS = Object.keys(ROLE_LABELS);

interface TeamMember {
  userId: string;
  teamId: string;
  role: string;
  createdAt: string;
  User: { id: string; name: string | null; email: string; role: string };
}

interface TeamDetail {
  id: string;
  name: string;
  description: string | null;
  TeamMember: TeamMember[];
  _count: { Dossier: number };
}

interface CabinetUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function EquipeDetailPage() {
  const params = useParams();
  const teamId = params?.id as string;
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [cabinetUsers, setCabinetUsers] = useState<CabinetUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('MEMBER');
  const [adding, setAdding] = useState(false);

  const fetchData = useCallback(async () => {
    if (!teamId) return;
    try {
      const [teamRes, usersRes] = await Promise.all([
        fetch(`/api/teams/${teamId}`),
        fetch('/api/admin/team'),
      ]);

      if (teamRes.status === 404) {
        setNotFound(true);
        return;
      }
      if (!teamRes.ok) throw new Error('Erreur chargement de l\'équipe');

      const teamData = await teamRes.json();
      setTeam(teamData.team);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setCabinetUsers(usersData.members || usersData.users || []);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de charger l'équipe" });
    } finally {
      setLoading(false);
    }
  }, [teamId, toast]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/fr/auth/login');
      return;
    }
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, fetchData, router]);

  const availableUsers = cabinetUsers.filter(
    (u) => !team?.TeamMember.some((m) => m.userId === u.id)
  );

  const handleAdd = async () => {
    if (!selectedUserId) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, role: selectedRole }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Erreur ajout du membre');
      }
      toast({ variant: 'success', title: 'Membre ajouté' });
      setSelectedUserId('');
      setSelectedRole('MEMBER');
      fetchData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erreur', description: (error as Error).message });
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId: string, userName: string) => {
    if (!confirm(`Retirer ${userName} de l'équipe ?`)) return;
    try {
      const res = await fetch(`/api/teams/${teamId}/members?userId=${userId}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Erreur retrait du membre');
      }
      toast({ variant: 'success', title: 'Membre retiré' });
      fetchData();
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

  if (notFound || !team) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <Card className="p-6 text-center">
            <p className="text-gray-700 font-medium">Équipe introuvable.</p>
            <Button className="mt-4" onClick={() => router.push('/admin/equipes')}>
              Retour aux équipes
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button
            onClick={() => router.push('/admin/equipes')}
            className="mb-4 bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Retour aux équipes
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
          {team.description && <p className="text-gray-600 mt-1">{team.description}</p>}
          <p className="text-sm text-gray-500 mt-1">{team._count.Dossier} dossier(s) rattaché(s)</p>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <UserPlus size={20} className="text-blue-600" />
            Ajouter un membre
          </h2>
          {availableUsers.length === 0 ? (
            <p className="text-gray-500 text-sm">Tous les utilisateurs du cabinet sont déjà dans cette équipe.</p>
          ) : (
            <div className="flex flex-col md:flex-row gap-3">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choisir un utilisateur --</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleAdd}
                disabled={adding || !selectedUserId}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus size={18} />}
                Ajouter
              </Button>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            Membres de l'équipe ({team.TeamMember.length})
          </h2>
          {team.TeamMember.length === 0 ? (
            <p className="text-gray-500 text-center py-6">Aucun membre pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {team.TeamMember.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">{member.User.name || member.User.email}</p>
                    <p className="text-sm text-gray-500">{member.User.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>{ROLE_LABELS[member.role] || member.role}</Badge>
                    <button
                      onClick={() => handleRemove(member.userId, member.User.name || member.User.email)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Retirer de l'équipe"
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
