'use client';

import StatsGrid from '@/components/ui/StatsGrid';
import { Card } from '@/components/ui/card';
import { Activity, Clock, DollarSign, Users } from 'lucide-react';

export default function AdminDashboard() {
    const stats = [
        { label: 'Utilisateurs actifs', value: '1,248', icon: Users, trend: '+12%', trendUp: true },
        { label: 'Revenu (30j)', value: '$54,283', icon: DollarSign, trend: '+23%', trendUp: true },
        { label: 'Latence moyenne', value: '245ms', icon: Clock, trend: '-8%', trendUp: true },
        { label: 'Santé système', value: '99.95%', icon: Activity, trend: '+0.1%', trendUp: true },
    ];

    return (
        <section className="space-y-6">
            <header className="space-y-1">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-gray-600">Vue d’ensemble des métriques clés.</p>
            </header>

            {/* Key Metrics Grid */}
            <StatsGrid items={stats} />

            {/* Recent Activity */}
            <Card title="Activité récente">
                <div className="space-y-3">
                    {[
                        { action: 'Nouvel utilisateur', time: 'il y a 2 min' },
                        { action: 'Paiement traité', time: 'il y a 15 min' },
                        { action: 'Backup terminé', time: 'il y a 1 h' },
                    ].map((activity, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                            <span className="text-gray-800">{activity.action}</span>
                            <span className="text-gray-500 text-sm">{activity.time}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </section>
    );
}
