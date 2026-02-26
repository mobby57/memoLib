'use client';

import { useState, useEffect } from 'react';
import { X, Settings, Check } from 'lucide-react';

interface ConsentPreferences {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
    personalization: boolean;
}

export default function ConsentBanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [preferences, setPreferences] = useState<ConsentPreferences>({
        essential: true,
        analytics: false,
        marketing: false,
        personalization: false
    });

    useEffect(() => {
        // Check if user has already made consent choice
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            setShowBanner(true);
        } else {
            const saved = JSON.parse(consent);
            setPreferences(saved);
            applyConsent(saved);
        }
    }, []);

    const applyConsent = (prefs: ConsentPreferences) => {
        // Google Analytics
        if (prefs.analytics) {
            loadGoogleAnalytics();
        }

        // Marketing pixels
        if (prefs.marketing) {
            loadMarketingScripts();
        }

        // Personalization
        if (prefs.personalization) {
            enablePersonalization();
        }

        // Save to backend
        saveConsentToServer(prefs);
    };

    const acceptAll = () => {
        const allAccepted: ConsentPreferences = {
            essential: true,
            analytics: true,
            marketing: true,
            personalization: true
        };

        setPreferences(allAccepted);
        localStorage.setItem('cookie_consent', JSON.stringify(allAccepted));
        applyConsent(allAccepted);
        setShowBanner(false);
    };

    const acceptEssentialOnly = () => {
        const essentialOnly: ConsentPreferences = {
            essential: true,
            analytics: false,
            marketing: false,
            personalization: false
        };

        setPreferences(essentialOnly);
        localStorage.setItem('cookie_consent', JSON.stringify(essentialOnly));
        applyConsent(essentialOnly);
        setShowBanner(false);
    };

    const savePreferences = () => {
        localStorage.setItem('cookie_consent', JSON.stringify(preferences));
        applyConsent(preferences);
        setShowBanner(false);
        setShowSettings(false);
    };

    const loadGoogleAnalytics = () => {
        if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GA_ID) {
            const script = document.createElement('script');
            script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`;
            script.async = true;
            document.head.appendChild(script);

            (window as any).dataLayer = (window as any).dataLayer || [];
            function gtag(...args: any[]) {
                (window as any).dataLayer.push(args);
            }
            gtag('js', new Date());
            gtag('config', process.env.NEXT_PUBLIC_GA_ID);
        }
    };

    const loadMarketingScripts = () => {
        // Facebook Pixel, LinkedIn Insight Tag, etc.
        console.log('Marketing scripts loaded');
    };

    const enablePersonalization = () => {
        // Enable personalized content
        console.log('Personalization enabled');
    };

    const saveConsentToServer = async (prefs: ConsentPreferences) => {
        try {
            await fetch('/api/compliance/consent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    consents: Object.entries(prefs).map(([type, granted]) => ({
                        type,
                        granted
                    }))
                })
            });
        } catch (error) {
            console.error('Failed to save consent:', error);
        }
    };

    if (!showBanner) return null;

    return (
        <>
            {/* Main Banner */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-4 md:p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        {/* Content */}
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-2">🍪 We value your privacy</h3>
                            <p className="text-sm text-gray-600 mb-3 md:mb-0">
                                We use cookies to enhance your experience, analyze site traffic, and for marketing purposes.
                                You can customize your preferences or accept all cookies.{' '}
                                <a href="/legal/cookies" className="text-blue-600 hover:underline">
                                    Learn more
                                </a>
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <button
                                onClick={() => setShowSettings(true)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
                            >
                                <Settings size={16} />
                                Customize
                            </button>
                            <button
                                onClick={acceptEssentialOnly}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Essential Only
                            </button>
                            <button
                                onClick={acceptAll}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Accept All
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-2xl font-bold">Cookie Preferences</h2>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Essential */}
                            <div>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            Essential Cookies
                                            <span className="text-xs bg-gray-200 px-2 py-1 rounded">Required</span>
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            These cookies are necessary for the website to function and cannot be disabled.
                                            They are usually only set in response to actions made by you such as setting your
                                            privacy preferences, logging in or filling in forms.
                                        </p>
                                    </div>
                                    <div className="ml-4 mt-1">
                                        <Check size={20} className="text-green-600" />
                                    </div>
                                </div>
                            </div>

                            {/* Analytics */}
                            <div>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h3 className="font-semibold">Analytics Cookies</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            These cookies help us understand how visitors interact with our website by collecting
                                            and reporting information anonymously. This helps us improve our service.
                                        </p>
                                    </div>
                                    <label className="ml-4 relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={preferences.analytics}
                                            onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>

                            {/* Marketing */}
                            <div>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h3 className="font-semibold">Marketing Cookies</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            These cookies are used to track visitors across websites. The intention is to display
                                            ads that are relevant and engaging for the individual user.
                                        </p>
                                    </div>
                                    <label className="ml-4 relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={preferences.marketing}
                                            onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>

                            {/* Personalization */}
                            <div>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h3 className="font-semibold">Personalization Cookies</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            These cookies enable the website to provide enhanced functionality and personalization.
                                            They remember your preferences and settings.
                                        </p>
                                    </div>
                                    <label className="ml-4 relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={preferences.personalization}
                                            onChange={(e) => setPreferences({ ...preferences, personalization: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
                            <a href="/legal/cookies" className="text-sm text-blue-600 hover:underline">
                                Learn more about cookies
                            </a>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={savePreferences}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Save Preferences
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
