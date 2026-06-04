'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, AlertTriangle, Calendar, FileText, CheckCircle } from 'lucide-react';

interface TodayData {
  urgentEmails: number;
  dueTodayDeadlines: number;
  hearingsToday: number;
  pendingDossiers: number;
}

export function TodayFocus({ tenantId }: { tenantId?: string }) {
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) { setLoading(false); return; }

    Promise.allSettled([
      fetch(`/api/legal-deadlines?tenantId=${tenantId}&dueToday=true`).then(r => r.ok ? r.json() : { count: 0 }),
      fetch(`/api/emails?tenantId=${tenantId}&filter=urgent&countOnly=true`).then(r => r.ok ? r.json() : { count: 0 }),
    ]).then(([deadlines, emails]) => {
      setData({
        dueTodayDeadlines: (deadlines.status === 'fulfilled' ? deadlines.value?.count ?? deadlines.value?.deadlines?.length : 0) || 0,
        urgentEmails: (emails.status === 'fulfilled' ? emails.value?.count : 0) || 0,
        hearingsToday: 0,
        pendingDossiers: 0,
      });
    }).finally(() => setLoading(false));
  }, [tenantId]);

  if (loading) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-32 mb-3" />
      <div className="grid grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
      </div>
    </div>
  );

  if (!data) return null;

  const total = data.urgentEmails + data.dueTodayDeadlines + data.hearingsToday + data.pendingDossiers;

  if (total === 0) return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-3">
      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
      <p className="text-green-700 font-medium text-sm">Rien d&apos;urgent aujourd&apos;hui — votre journée est libre.</p>
    </div>
  );

  const items = [
    { count: data.urgentEmails, label: 'Emails urgents', href: '/emails?filter=urgent', icon: Mail, bg: 'bg-red-50', border: 'border-red-200 hover:border-red-400', iconColor: 'text-red-500', textColor: 'text-red-700' },
    { count: data.dueTodayDeadlines, label: "Échéances aujourd'hui", href: '/dossiers?deadline=today', icon: AlertTriangle, bg: 'bg-orange-50', border: 'border-orange-200 hover:border-orange-400', iconColor: 'text-orange-500', textColor: 'text-orange-700' },
    { count: data.hearingsToday, label: 'Audiences', href: '/calendrier', icon: Calendar, bg: 'bg-blue-50', border: 'border-blue-200 hover:border-blue-400', iconColor: 'text-blue-500', textColor: 'text-blue-700' },
    { count: data.pendingDossiers, label: 'Dossiers en attente', href: '/dossiers?status=pending', icon: FileText, bg: 'bg-purple-50', border: 'border-purple-200 hover:border-purple-400', iconColor: 'text-purple-500', textColor: 'text-purple-700' },
  ].filter(i => i.count > 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        📋 Ma journée
        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{total}</span>
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map(item => (
          <Link key={item.label} href={item.href}
            className={`${item.bg} ${item.border} border rounded-xl p-3 transition-colors`}>
            <item.icon className={`w-5 h-5 ${item.iconColor} mb-1`} />
            <p className={`text-xl font-bold ${item.textColor}`}>{item.count}</p>
            <p className="text-xs text-gray-600">{item.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
