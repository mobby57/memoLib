'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
    { month: 'Jan', free: 400, pro: 300, enterprise: 200 },
    { month: 'Feb', free: 300, pro: 200, enterprise: 220 },
    { month: 'Mar', free: 200, pro: 278, enterprise: 229 },
    { month: 'Apr', free: 278, pro: 189, enterprise: 200 },
    { month: 'May', free: 189, pro: 239, enterprise: 221 },
    { month: 'Jun', free: 239, pro: 349, enterprise: 250 },
];

export default function AnalyticsDashboard() {
    return (
        <section className="space-y-6">
            <header>
                <h1 className="text-3xl font-semibold text-gray-900">Analytics</h1>
                <p className="text-gray-500">Platform usage and growth metrics.</p>
            </header>

            {/* User Growth Chart */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">User Growth by Plan</h2>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="free" fill="#94a3b8" name="Free Plan" />
                        <Bar dataKey="pro" fill="#2563eb" name="Pro Plan" />
                        <Bar dataKey="enterprise" fill="#059669" name="Enterprise" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600 text-sm">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">5,432</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600 text-sm">Conversion Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">3.24%</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600 text-sm">Avg. Session Duration</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">12m 34s</p>
                </div>
            </div>
        </section>
    );
}
