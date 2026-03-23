'use client';

export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  status: string;
  lastLogin?: string;
  createdAt: string;
}

const ROLES = [
  { value: 'AVOCAT', label: 'Avocat titulaire', emoji: '⚖️', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'ASSOCIE', label: 'Associé', emoji: '🤝', color: 'bg-purple-100 text-purple-800' },
  { value: 'COLLABORATEUR', label: 'Collaborateur', emoji: '👨‍💼', color: 'bg-blue-100 text-blue-800' },
  { value: 'STAGIAIRE', label: 'Stagiaire', emoji: '🎓', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'SECRETAIRE', label: 'Secrétaire', emoji: '📋', color: 'bg-amber-100 text-amber-800' },
  { value: 'COMPTABLE', label: 'Comptable', emoji: '💰', color: 'bg-green-100 text-green-800' },
];

function getRoleInfo(role: string) {
  return ROLES.find(r => r.value === role) || { value: role, label: role, emoji: '👤', color: 'bg-gray-100 text-gray-800' };
}

export default function TeamPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', memberRole: 'COLLABORATEUR', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    else if (session?.user) fetchTeam();
  }, [session, status]);

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/admin/team');
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setTempPassword(null);

    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        setTempPassword(data.tempPassword);
        setInviteForm({ name: '', email: '', memberRole: 'COLLABORATEUR', phone: '' });
        fetchTeam();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau' });
    }
    setSubmitting(false);
  };

  const handleToggleStatus = async (memberId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const res = await fetch('/api/admin/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, status: newStatus }),
    });
    if (res.ok) fetchTeam();
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    const res = await fetch('/api/admin/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, newRole }),
    });
    if (res.ok) fetchTeam();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  const staffMembers = members.filter(m => m.role !== 'CLIENT');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                ← Retour
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  👥 Équipe du Cabinet
                </h1>
                <p className="text-gray-600 mt-1">{staffMembers.length} membre(s)</p>
              </div>
            </div>
            <button
              onClick={() => { setShowInvite(!showInvite); setMessage(null); setTempPassword(null); }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
            >
              {showInvite ? '✕ Fermer' : '+ Inviter un membre'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Formulaire d'invitation */}
        {showInvite && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-l-4 border-blue-500">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Inviter un nouveau membre</h2>

            {message && (
              <div className={`p-4 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {message.text}
              </div>
            )}

            {tempPassword && (
              <div className="p-4 rounded-lg mb-4 bg-amber-50 border border-amber-200">
                <p className="font-semibold text-amber-800">🔑 Mot de passe temporaire :</p>
                <code className="text-lg font-mono bg-white px-3 py-1 rounded border">{tempPassword}</code>
                <p className="text-sm text-amber-600 mt-1">Communiquez-le au membre. Il devra le changer à la première connexion.</p>
              </div>
            )}

            <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={inviteForm.name}
                  onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })}
                  placeholder="Marie Leroy"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="marie@cabinet.fr"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Rôle *</label>
                <select
                  value={inviteForm.memberRole}
                  onChange={e => setInviteForm({ ...inviteForm, memberRole: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.emoji} {r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={inviteForm.phone}
                  onChange={e => setInviteForm({ ...inviteForm, phone: e.target.value })}
                  placeholder="06 12 34 56 78"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Envoi...' : '✉️ Inviter'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Grille des rôles */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {ROLES.map(role => {
            const count = staffMembers.filter(m => m.role === role.value).length;
            return (
              <div key={role.value} className="bg-white rounded-xl shadow p-4 text-center">
                <span className="text-2xl">{role.emoji}</span>
                <p className="font-semibold text-sm mt-1">{role.label}</p>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
              </div>
            );
          })}
        </div>

        {/* Liste des membres */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {staffMembers.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">👥</span>
              <p className="text-gray-500 text-lg">Aucun membre dans l&apos;équipe</p>
              <p className="text-gray-400">Cliquez sur &quot;Inviter un membre&quot; pour commencer</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-gray-600 font-semibold">Membre</th>
                    <th className="text-left py-4 px-6 text-gray-600 font-semibold">Rôle</th>
                    <th className="text-center py-4 px-6 text-gray-600 font-semibold">Statut</th>
                    <th className="text-center py-4 px-6 text-gray-600 font-semibold">Dernière connexion</th>
                    <th className="text-right py-4 px-6 text-gray-600 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffMembers.map(member => {
                    const roleInfo = getRoleInfo(member.role);
                    return (
                      <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                              {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{member.name}</p>
                              <p className="text-sm text-gray-500">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <select
                            value={member.role}
                            onChange={e => handleChangeRole(member.id, e.target.value)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${roleInfo.color}`}
                          >
                            {ROLES.map(r => (
                              <option key={r.value} value={r.value}>{r.emoji} {r.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => handleToggleStatus(member.id, member.status)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                              member.status === 'active'
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {member.status === 'active' ? '✅ Actif' : '⛔ Inactif'}
                          </button>
                        </td>
                        <td className="py-4 px-6 text-center text-sm text-gray-500">
                          {member.lastLogin
                            ? new Date(member.lastLogin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                            : 'Jamais'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleToggleStatus(member.id, member.status)}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-semibold hover:bg-gray-200 transition-colors"
                          >
                            {member.status === 'active' ? 'Désactiver' : 'Réactiver'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
