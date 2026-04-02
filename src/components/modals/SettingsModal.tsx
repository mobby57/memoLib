import { useState } from 'react';

interface SettingsModalProps {
    open: boolean;
    onClose: () => void;
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [weeklyDigest, setWeeklyDigest] = useState(false);

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Workspace Settings</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Configure notifications and default preferences for your team.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close settings"
                        className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200"
                    >
                        ×
                    </button>
                </div>

                <div className="mt-6 space-y-4">
                    <label className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                        <div>
                            <p className="font-medium text-gray-900">Email notifications</p>
                            <p className="text-sm text-gray-500">Receive alerts about document updates.</p>
                        </div>
                        <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={emailNotifications}
                            onChange={(event) => setEmailNotifications(event.target.checked)}
                        />
                    </label>

                    <label className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                        <div>
                            <p className="font-medium text-gray-900">Weekly digest</p>
                            <p className="text-sm text-gray-500">Summary of workspace activity each Monday.</p>
                        </div>
                        <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={weeklyDigest}
                            onChange={(event) => setWeeklyDigest(event.target.checked)}
                        />
                    </label>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
                        onClick={onClose}
                    >
                        Save changes
                    </button>
                </div>
            </div>
        </div>
    );
}
