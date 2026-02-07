'use client';

import React, { useState } from 'react';
import { Settings, Plus, CheckCircle, AlertCircle, Link } from 'lucide-react';

interface Integration {
    id: string;
    name: string;
    description: string;
    connected: boolean;
    lastSynced?: string;
    icon: string;
}

export default function IntegrationsDashboard() {
    const [integrations, setIntegrations] = useState<Integration[]>([
        {
            id: 'slack',
            name: 'Slack',
            description: 'Send notifications to Slack channels',
            connected: true,
            lastSynced: '2024-01-15T10:30:00Z',
            icon: '💬'
        },
        {
            id: 'zapier',
            name: 'Zapier',
            description: 'Automate workflows with 5000+ apps',
            connected: false,
            icon: '⚡'
        },
    ]);

    const handleConnect = (id: string) => {
        setIntegrations(prev =>
            prev.map(int =>
                int.id === id
                    ? { ...int, connected: !int.connected, lastSynced: new Date().toISOString() }
                    : int
            )
        );
    };

    return (
        <section className="space-y-6">
            <header>
                <h1 className="text-3xl font-semibold text-gray-900">Integrations</h1>
                <p className="text-gray-500">Connect with your favorite tools and services</p>
            </header>

            <div className="grid gap-4">
                {integrations.map(integration => (
                    <div key={integration.id} className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="text-4xl">{integration.icon}</div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                                <p className="text-gray-600">{integration.description}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleConnect(integration.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            {integration.connected ? 'Disconnect' : 'Connect'}
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}
