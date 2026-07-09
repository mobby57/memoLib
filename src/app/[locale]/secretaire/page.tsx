'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  Calendar,
  Users,
  Phone,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Bell,
  ArrowRight,
} from 'lucide-react';

interface TodayEmail {
  id: string;
  from: string;
  subject: string;
  urgency: string;
  receivedAt: string;
  isProcessed: boolean;
}

interface TodayRDV {
  id: string;
  title: string;
  time: string;
  client: string;
}

interface PendingTask {
  id: string;
  type: 'relance' | 'piece_manquante' | 'rdv_confirmer' | 'courrier';
  label: string;
  dueDate: string;
  clientName: string;
}

/**
 * Vue Secrétaire — Dashboard simplifié orienté action
 * Focus: emails du jour, RDV, relances, tâches administratives
 */
export default function SecretaireDashboard() {
  const { user } = useAuth();
  const pathname = usePathname() ?? '';
  const locale = pathname.split('/')[1] || 'fr';
  const lhref = (path: string) => `/${locale}${path}`;

  const [emails, setEmails] = useState<TodayEmail[]>([]);
  const [rdvs, setRDvs] = useState<TodayRDV[]>([]);
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      // Charger les emails non traités
      const emailsRes = await fetch('/api/emails/fetch?filter=unprocessed&limit=10');
      if (emailsRes.ok) {
        const data = await emailsRes.json();
        setEmails(data.emails || []);
      }

      // Charger les RDV du jour
      const today = new Date().toISOString().split('T')[0];
      const rdvRes = await fetch(`/api/appointments?date=${today}`);
      if (rdvRes.ok) {
        const data = await rdvRes.json();
        setRDvs(data.appointments || []);
      }

      // Charger les tâches en attente
      const tasksRes = await fetch('/api/pending-actions');
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.actions || []);
      }
    } catch {
      // Fallback: données de démo
      setEmails([
        { id: '1', from: 'prefecture-paris@gouv.fr', subject: 'Convocation M. DIALLO', urgency: 'high', receivedAt: new Date().toISOString(), isProcessed: false },
        { id: '2', from: 'ta-paris@justice.fr', subject: 'Audience 15/07 - Dossier KEITA', urgency: 'high', receivedAt: new Date().toISOString(), isProcessed: false },
        { id: '3', from: 'amadou.diallo@gmail.com', subject: 'Pièces complémentaires', urgency: 'medium', receivedAt: new Date().toISOString(), isProcessed: false },
      ]);
      setRDvs([
        { id: '1', title: 'Consultation initiale', time: '09:30', client: 'Mme Traoré' },
        { id: '2', title: 'Point dossier OQTF', time: '14:00', client: 'M. Diallo' },
        { id: '3', title: 'Signature convention', time: '16:30', client: 'M. Ba' },
      ]);
      setTasks([
        { id: '1', type: 'relance', label: 'Relancer pour pièces manquantes', dueDate: 'Aujourd\'hui', clientName: 'M. Sylla' },
        { id: '2', type: 'rdv_confirmer', label: 'Confirmer RDV audience TA', dueDate: 'Demain', clientName: 'M. Keita' },
        { id: '3', type: 'courrier', label: 'Envoyer accusé de réception', dueDate: 'Aujourd\'hui', clientName: 'Mme Diop' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const urgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': case 'critique': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': case 'haute': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          {' • '}{emails.length} emails à traiter • {rdvs.length} RDV aujourd&apos;hui • {tasks.length} tâches
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne 1: Emails du jour */}
        <div className="lg:col-span-2 space-y-6">
          {/* Emails non traités */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Emails à traiter
                {emails.length > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-bold">
                    {emails.length}
                  </span>
                )}
              </h2>
              <Link href={lhref('/emails')} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {emails.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
                  <p>Tous les emails sont traités !</p>
                </div>
              ) : (
                emails.map(email => (
                  <div key={email.id} className={`p-3 rounded-xl border ${urgencyColor(email.urgency)} flex items-start gap-3`}>
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{email.subject}</p>
                      <p className="text-xs opacity-75">De: {email.from}</p>
                    </div>
                    <Link
                      href={lhref(`/emails?id=${email.id}`)}
                      className="px-3 py-1 bg-white rounded-lg text-xs font-medium border shadow-sm hover:bg-gray-50"
                    >
                      Traiter
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tâches en attente */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-500" />
                Tâches du jour
              </h2>
            </div>

            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    task.type === 'relance' ? 'bg-orange-100 text-orange-600' :
                    task.type === 'rdv_confirmer' ? 'bg-blue-100 text-blue-600' :
                    task.type === 'courrier' ? 'bg-green-100 text-green-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {task.type === 'relance' ? <Phone className="w-4 h-4" /> :
                     task.type === 'rdv_confirmer' ? <Calendar className="w-4 h-4" /> :
                     <FileText className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{task.label}</p>
                    <p className="text-xs text-gray-500">{task.clientName} • {task.dueDate}</p>
                  </div>
                  <button className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                    Fait ✓
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne 2: RDV + Actions rapides */}
        <div className="space-y-6">
          {/* RDV du jour */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Rendez-vous
            </h2>

            <div className="space-y-3">
              {rdvs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Aucun RDV aujourd&apos;hui</p>
              ) : (
                rdvs.map(rdv => (
                  <div key={rdv.id} className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                    <div className="text-center">
                      <p className="text-lg font-bold text-indigo-700">{rdv.time}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{rdv.title}</p>
                      <p className="text-xs text-gray-500">{rdv.client}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Link
              href={lhref('/calendrier')}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Voir le calendrier
            </Link>
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
            <div className="space-y-2">
              <Link href={lhref('/clients')} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">Nouveau client</span>
              </Link>
              <Link href={lhref('/calendrier')} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <Clock className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">Planifier RDV</span>
              </Link>
              <Link href={lhref('/emails')} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <Mail className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium">Boîte de réception</span>
              </Link>
              <Link href={lhref('/dossiers')} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <FileText className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-medium">Voir les dossiers</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
