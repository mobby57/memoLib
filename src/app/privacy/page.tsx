'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Download, Trash2, Shield, FileText, AlertTriangle } from 'lucide-react';

export default function PrivacyPage() {
    const { data: session } = useSession();
    const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleExportData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/compliance/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ format: exportFormat })
            });

            if (response.ok) {
                const data = await response.json();
                alert(`✅ ${data.message}\n\nRequest ID: ${data.requestId}\nEstimated time: ${data.estimatedTime}`);
            } else {
                const error = await response.json();
                alert(`❌ Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('❌ Export request failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/compliance/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: deleteReason })
            });

            if (response.ok) {
                const data = await response.json();
                alert(`✅ ${data.message}\n\nScheduled for: ${new Date(data.scheduledFor).toLocaleDateString()}\nGrace period: ${data.gracePeriod}`);
                setShowDeleteConfirm(false);
            } else {
                const error = await response.json();
                alert(`❌ Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Deletion failed:', error);
            alert('❌ Deletion request failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <Shield className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy & Data Rights</h1>
                    <p className="text-lg text-gray-600">
                        Your data, your rights. Manage your privacy settings and data protection options.
                    </p>
                </div>

                {/* GDPR Rights Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <FileText size={20} />
                        Your GDPR Rights
                    </h2>
                    <ul className="space-y-2 text-sm text-gray-700">
                        <li>✅ <strong>Right to Access</strong> - Get a copy of your personal data</li>
                        <li>✅ <strong>Right to Rectification</strong> - Correct inaccurate data</li>
                        <li>✅ <strong>Right to Erasure</strong> - Request deletion of your data</li>
                        <li>✅ <strong>Right to Data Portability</strong> - Export your data in a structured format</li>
                        <li>✅ <strong>Right to Object</strong> - Object to certain processing activities</li>
                        <li>✅ <strong>Right to Restriction</strong> - Limit how we use your data</li>
                    </ul>
                </div>

                {/* Export Data Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                        <Download size={24} />
                        Export Your Data
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Download a complete copy of your personal data. This includes your profile, emails,
                        payments, and activity history.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Export Format
                            </label>
                            <select
                                value={exportFormat}
                                onChange={(e) => setExportFormat(e.target.value as any)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="json">JSON (Machine-readable)</option>
                                <option value="csv">CSV (Spreadsheet)</option>
                                <option value="pdf">PDF (Human-readable)</option>
                            </select>
                        </div>

                        <button
                            onClick={handleExportData}
                            disabled={loading || !session}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Download size={20} />
                            {loading ? 'Processing...' : 'Request Data Export'}
                        </button>

                        <p className="text-xs text-gray-500">
                            ℹ️ You'll receive an email when your export is ready (usually within 5-10 minutes).
                            The download link will be valid for 30 days.
                        </p>
                    </div>
                </div>

                {/* Cookie Preferences */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Cookie Preferences</h2>
                    <p className="text-gray-600 mb-4">
                        Manage how we use cookies and tracking technologies on our website.
                    </p>
                    <button
                        onClick={() => {
                            localStorage.removeItem('cookie_consent');
                            window.location.reload();
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Update Cookie Settings
                    </button>
                </div>

                {/* Delete Account Section */}
                <div className="bg-white rounded-lg shadow-md p-6 border-2 border-red-200">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-red-600">
                        <Trash2 size={24} />
                        Delete Your Account
                    </h2>
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                        <p className="text-sm text-red-800 flex items-start gap-2">
                            <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
                            <span>
                                <strong>Warning:</strong> This action will permanently delete your account and all
                                associated data after a 30-day grace period. You can cancel the deletion request
                                anytime during this period.
                            </span>
                        </p>
                    </div>

                    {!showDeleteConfirm ? (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={!session}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Request Account Deletion
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for leaving (optional)
                                </label>
                                <textarea
                                    value={deleteReason}
                                    onChange={(e) => setDeleteReason(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                                    placeholder="Help us improve by telling us why you're leaving..."
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
                                >
                                    {loading ? 'Processing...' : 'Confirm Deletion'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Contact DPO */}
                <div className="mt-8 text-center text-sm text-gray-600">
                    <p>
                        Questions about your data rights?{' '}
                        <a href="mailto:privacy@memolib.com" className="text-blue-600 hover:underline">
                            Contact our Data Protection Officer
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
