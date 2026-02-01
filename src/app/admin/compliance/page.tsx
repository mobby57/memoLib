'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Shield, FileText, Download, AlertTriangle, TrendingUp, Users, Activity, Database } from 'lucide-react';

interface ComplianceStats {
    totalConsents: number;
    consentRate: number;
    activeExports: number;
    pendingDeletions: number;
    auditLogCount: number;
    dataBreaches: number;
}

interface ExportRequest {
    id: string;
    userId: string;
    userEmail: string;
    format: string;
    status: string;
    requestedAt: Date;
    completedAt?: Date;
    downloadUrl?: string;
}

interface DeletionRequest {
    id: string;
    userId: string;
    userEmail: string;
    reason?: string;
    status: string;
    requestedAt: Date;
    scheduledFor: Date;
}

export default function ComplianceDashboard() {
    const { data: session, status } = useSession();
    const [stats, setStats] = useState<ComplianceStats | null>(null);
    const [exports, setExports] = useState<ExportRequest[]>([]);
    const [deletions, setDeletions] = useState<DeletionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'exports' | 'deletions' | 'audit'>('overview');

    useEffect(() => {
        if (status === 'authenticated') {
            fetchComplianceData();
        }
    }, [status]);

    const fetchComplianceData = async () => {
        setLoading(true);
        try {
            // Fetch stats
            const statsRes = await fetch('/api/admin/compliance/stats');
            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data);
            }

            // Fetch export requests
            const exportsRes = await fetch('/api/admin/compliance/exports');
            if (exportsRes.ok) {
                const data = await exportsRes.json();
                setExports(data.requests);
            }

            // Fetch deletion requests
            const deletionsRes = await fetch('/api/admin/compliance/deletions');
            if (deletionsRes.ok) {
                const data = await deletionsRes.json();
                setDeletions(data.requests);
            }
        } catch (error) {
            console.error('Failed to fetch compliance data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">You must be logged in to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-8 h-8 text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Compliance Dashboard</h1>
                    </div>
                    <p className="text-gray-600">
                        Monitor GDPR compliance, data exports, and user rights requests
                    </p>
                </div>

                {/* Stats Overview */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            icon={<Users className="w-6 h-6" />}
                            label="Consent Rate"
                            value={`${stats.consentRate.toFixed(1)}%`}
                            color="blue"
                        />
                        <StatCard
                            icon={<Download className="w-6 h-6" />}
                            label="Active Exports"
                            value={stats.activeExports.toString()}
                            color="green"
                        />
                        <StatCard
                            icon={<AlertTriangle className="w-6 h-6" />}
                            label="Pending Deletions"
                            value={stats.pendingDeletions.toString()}
                            color="orange"
                        />
                        <StatCard
                            icon={<Activity className="w-6 h-6" />}
                            label="Audit Logs"
                            value={stats.auditLogCount.toLocaleString()}
                            color="purple"
                        />
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <TabButton
                                active={activeTab === 'overview'}
                                onClick={() => setActiveTab('overview')}
                                icon={<TrendingUp className="w-5 h-5" />}
                                label="Overview"
                            />
                            <TabButton
                                active={activeTab === 'exports'}
                                onClick={() => setActiveTab('exports')}
                                icon={<Download className="w-5 h-5" />}
                                label="Data Exports"
                                badge={exports.filter(e => e.status === 'pending').length}
                            />
                            <TabButton
                                active={activeTab === 'deletions'}
                                onClick={() => setActiveTab('deletions')}
                                icon={<AlertTriangle className="w-5 h-5" />}
                                label="Deletion Requests"
                                badge={deletions.filter(d => d.status === 'scheduled').length}
                            />
                            <TabButton
                                active={activeTab === 'audit'}
                                onClick={() => setActiveTab('audit')}
                                icon={<FileText className="w-5 h-5" />}
                                label="Audit Trail"
                            />
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'overview' && <OverviewTab stats={stats} />}
                        {activeTab === 'exports' && <ExportsTab exports={exports} onRefresh={fetchComplianceData} />}
                        {activeTab === 'deletions' && <DeletionsTab deletions={deletions} onRefresh={fetchComplianceData} />}
                        {activeTab === 'audit' && <AuditTab />}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({ icon, label, value, color }: any) {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        orange: 'bg-orange-100 text-orange-600',
        purple: 'bg-purple-100 text-purple-600',
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className={`inline-flex p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} mb-4`}>
                {icon}
            </div>
            <p className="text-gray-600 text-sm mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
    );
}

// Tab Button Component
function TabButton({ active, onClick, icon, label, badge }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${active
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
        >
            {icon}
            {label}
            {badge > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                    {badge}
                </span>
            )}
        </button>
    );
}

// Overview Tab
function OverviewTab({ stats }: { stats: ComplianceStats | null }) {
    if (!stats) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">GDPR Compliance Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ComplianceItem
                        label="Cookie Consent Banner"
                        status="Active"
                        statusColor="green"
                    />
                    <ComplianceItem
                        label="Privacy Policy"
                        status="v3.0.0 - Current"
                        statusColor="green"
                    />
                    <ComplianceItem
                        label="Data Export Mechanism"
                        status="Operational"
                        statusColor="green"
                    />
                    <ComplianceItem
                        label="Right to Erasure"
                        status="Operational"
                        statusColor="green"
                    />
                    <ComplianceItem
                        label="Data Retention Policies"
                        status="Automated"
                        statusColor="green"
                    />
                    <ComplianceItem
                        label="Audit Trail"
                        status={`${stats.auditLogCount.toLocaleString()} logs`}
                        statusColor="blue"
                    />
                </div>
            </div>
        </div>
    );
}

function ComplianceItem({ label, status, statusColor }: any) {
    const colorClasses = {
        green: 'bg-green-100 text-green-800',
        blue: 'bg-blue-100 text-blue-800',
        orange: 'bg-orange-100 text-orange-800',
    };

    return (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-gray-700 font-medium">{label}</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClasses[statusColor as keyof typeof colorClasses]}`}>
                {status}
            </span>
        </div>
    );
}

// Exports Tab
function ExportsTab({ exports, onRefresh }: any) {
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Data Export Requests</h3>
                <button
                    onClick={onRefresh}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                    Refresh
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Format</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {exports.map((exp: ExportRequest) => (
                            <tr key={exp.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exp.userEmail}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{exp.format.toUpperCase()}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${exp.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            exp.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {exp.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {new Date(exp.requestedAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {exp.downloadUrl && (
                                        <a href={exp.downloadUrl} className="text-blue-600 hover:text-blue-700">
                                            Download
                                        </a>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Deletions Tab
function DeletionsTab({ deletions, onRefresh }: any) {
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Account Deletion Requests</h3>
                <button
                    onClick={onRefresh}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                    Refresh
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled For</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {deletions.map((del: DeletionRequest) => (
                            <tr key={del.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{del.userEmail}</td>
                                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{del.reason || 'Not provided'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${del.status === 'scheduled' ? 'bg-orange-100 text-orange-800' :
                                            del.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {del.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {new Date(del.requestedAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {new Date(del.scheduledFor).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Audit Tab
function AuditTab() {
    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Trail Viewer</h3>
            <p className="text-gray-600 mb-4">
                View all user actions for compliance and security monitoring.
            </p>
            <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Audit trail viewer coming soon</p>
            </div>
        </div>
    );
}
