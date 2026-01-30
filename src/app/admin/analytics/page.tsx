'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    TrendingUp, Users, Mail, Cpu, DollarSign, Activity, Clock, Target,
    AlertCircle, CheckCircle, TrendingDown, Zap
} from 'lucide-react';

interface DashboardStats {
    revenue: {
        mrr: number;
        arr: number;
        growth: number;
    };
    engagement: {
        dau: number;
        mau: number;
        stickiness: number;
    };
    emails: {
        total: number;
        processed: number;
        avgTime: number;
    };
    ai: {
        inferences: number;
        avgTime: number;
        cost: number;
    };
}

export default function AnalyticsDashboard() {
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activeTab, setActiveTab] = useState<'revenue' | 'engagement' | 'emails' | 'ai'>('revenue');

    // Chart data
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [engagementData, setEngagementData] = useState<any[]>([]);
    const [emailData, setEmailData] = useState<any[]>([]);
    const [aiCostData, setAICostData] = useState<any[]>([]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchAnalytics();
        }
    }, [status]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // Fetch all analytics in parallel
            const [revenue, engagement, emails, ai] = await Promise.all([
                fetch('/api/analytics/revenue?type=current').then(r => r.json()),
                fetch('/api/analytics/engagement?type=current').then(r => r.json()),
                fetch('/api/analytics/emails?type=current').then(r => r.json()),
                fetch('/api/analytics/ai?type=current').then(r => r.json()),
            ]);

            setStats({
                revenue: revenue.data || {},
                engagement: engagement.data || {},
                emails: emails.data || {},
                ai: ai.data || {},
            });

            // Fetch trend data
            const [revenueTrend, sessionTrend, emailTrend, tokenTrend] = await Promise.all([
                fetch('/api/analytics/revenue?type=trend&months=6').then(r => r.json()),
                fetch('/api/analytics/engagement?type=sessions&days=30').then(r => r.json()),
                fetch('/api/analytics/emails?type=trend&days=30').then(r => r.json()),
                fetch('/api/analytics/ai?type=tokens&days=30').then(r => r.json()),
            ]);

            setRevenueData(revenueTrend.data || []);
            setEngagementData(sessionTrend.data || []);
            setEmailData(emailTrend.data || []);
            setAICostData(tokenTrend.data || []);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
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
                    <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">You must be logged in to view analytics.</p>
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
                        <Activity className="w-8 h-8 text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                    </div>
                    <p className="text-gray-600">
                        Real-time insights into revenue, engagement, emails, and AI performance
                    </p>
                </div>

                {/* KPI Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <KPICard
                            icon={<DollarSign className="w-6 h-6" />}
                            label="MRR"
                            value={formatCurrency(stats.revenue.mrr)}
                            trend={stats.revenue.growth}
                            color="green"
                        />
                        <KPICard
                            icon={<Users className="w-6 h-6" />}
                            label="DAU / MAU"
                            value={`${stats.engagement.dau} / ${stats.engagement.mau}`}
                            trend={stats.engagement.stickiness}
                            suffix="%"
                            color="blue"
                        />
                        <KPICard
                            icon={<Mail className="w-6 h-6" />}
                            label="Emails Processed"
                            value={stats.emails.processed.toLocaleString()}
                            subtitle={`Avg: ${formatTime(stats.emails.avgTime)}`}
                            color="purple"
                        />
                        <KPICard
                            icon={<Cpu className="w-6 h-6" />}
                            label="AI Cost (30d)"
                            value={formatCurrency(stats.ai.cost)}
                            subtitle={`${stats.ai.inferences.toLocaleString()} inferences`}
                            color="orange"
                        />
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <TabButton
                                active={activeTab === 'revenue'}
                                onClick={() => setActiveTab('revenue')}
                                icon={<TrendingUp className="w-5 h-5" />}
                                label="Revenue"
                            />
                            <TabButton
                                active={activeTab === 'engagement'}
                                onClick={() => setActiveTab('engagement')}
                                icon={<Users className="w-5 h-5" />}
                                label="Engagement"
                            />
                            <TabButton
                                active={activeTab === 'emails'}
                                onClick={() => setActiveTab('emails')}
                                icon={<Mail className="w-5 h-5" />}
                                label="Emails"
                            />
                            <TabButton
                                active={activeTab === 'ai'}
                                onClick={() => setActiveTab('ai')}
                                icon={<Cpu className="w-5 h-5" />}
                                label="AI Performance"
                            />
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'revenue' && <RevenueTab data={revenueData} stats={stats?.revenue} />}
                        {activeTab === 'engagement' && <EngagementTab data={engagementData} stats={stats?.engagement} />}
                        {activeTab === 'emails' && <EmailsTab data={emailData} stats={stats?.emails} />}
                        {activeTab === 'ai' && <AITab data={aiCostData} stats={stats?.ai} />}
                    </div>
                </div>
            </div>
        </div>
    );
}

// KPI Card Component
function KPICard({ icon, label, value, trend, suffix, subtitle, color }: any) {
    const colorClasses = {
        green: 'bg-green-100 text-green-600',
        blue: 'bg-blue-100 text-blue-600',
        purple: 'bg-purple-100 text-purple-600',
        orange: 'bg-orange-100 text-orange-600',
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
                    {icon}
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {Math.abs(trend).toFixed(1)}{suffix || '%'}
                    </div>
                )}
            </div>
            <p className="text-gray-600 text-sm mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
    );
}

// Tab Button
function TabButton({ active, onClick, icon, label }: any) {
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
        </button>
    );
}

// Revenue Tab
function RevenueTab({ data, stats }: any) {
    const chartData = data.map((d: any) => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short' }),
        MRR: d.mrr / 100,
        Subscriptions: d.activeSubscriptions,
    }));

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">MRR Trend (6 months)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => `$${value}`} />
                        <Legend />
                        <Area type="monotone" dataKey="MRR" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricBox label="ARR" value={formatCurrency(stats?.arr || 0)} />
                <MetricBox label="Active Subscriptions" value={stats?.activeSubscriptions || 0} />
                <MetricBox label="Churn Rate" value={`${(stats?.churnRate || 0).toFixed(2)}%`} />
            </div>
        </div>
    );
}

// Engagement Tab
function EngagementTab({ data, stats }: any) {
    const chartData = data.map((d: any) => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Sessions: d.sessions,
        Users: d.uniqueUsers,
    }));

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Sessions (30 days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Sessions" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="Users" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricBox label="WAU" value={stats?.wau || 0} />
                <MetricBox label="Avg Session" value={formatTime(stats?.averageSessionDuration || 0)} />
                <MetricBox label="Bounce Rate" value={`${(stats?.bounceRate || 0).toFixed(1)}%`} />
            </div>
        </div>
    );
}

// Emails Tab
function EmailsTab({ data, stats }: any) {
    const chartData = data.map((d: any) => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Received: d.received,
        Sent: d.sent,
    }));

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Volume (30 days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Received" fill="#3b82f6" />
                        <Bar dataKey="Sent" fill="#10b981" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricBox label="Total Received" value={stats?.totalReceived || 0} />
                <MetricBox label="Total Sent" value={stats?.totalSent || 0} />
                <MetricBox label="AI Accuracy" value={`${(stats?.aiAccuracy || 0).toFixed(1)}%`} />
            </div>
        </div>
    );
}

// AI Tab
function AITab({ data, stats }: any) {
    const chartData = data.map((d: any) => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Tokens: d.totalTokens / 1000,
        Cost: d.cost / 100,
    }));

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Token Usage & Cost (30 days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="Tokens" stroke="#8b5cf6" strokeWidth={2} name="Tokens (K)" />
                        <Line yAxisId="right" type="monotone" dataKey="Cost" stroke="#f59e0b" strokeWidth={2} name="Cost ($)" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricBox label="Total Inferences" value={stats?.totalInferences?.toLocaleString() || 0} />
                <MetricBox label="Avg Time" value={formatTime(stats?.averageInferenceTime || 0)} />
                <MetricBox label="Error Rate" value={`${(stats?.errorRate || 0).toFixed(2)}%`} />
            </div>
        </div>
    );
}

// Metric Box
function MetricBox({ label, value }: any) {
    return (
        <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-600 text-sm mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    );
}

// Helper functions
function formatCurrency(cents: number): string {
    return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatTime(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}
