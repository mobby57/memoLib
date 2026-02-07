'use client';

import { useState } from 'react';
import { X, Shield, AlertTriangle, Check, ExternalLink, Lock, Eye, FileText } from 'lucide-react';

/**
 * Integration Consent Modal - GDPR Compliant
 * 
 * Article 7 GDPR: Conditions for consent
 * - Freely given
 * - Specific
 * - Informed
 * - Unambiguous
 * 
 * Implements:
 * - Granular consent per data category
 * - Clear purpose explanation
 * - Revokable at any time
 * - DPA acceptance
 * - Audit trail
 */

export interface IntegrationConsent {
    provider: 'gmail' | 'outlook' | 'calendar' | 'slack' | 'hubspot' | 'salesforce';
    providerName: string;
    description: string;
    logo?: string;
    requiredScopes: ConsentScope[];
    optionalScopes: ConsentScope[];
    dataProcessingAgreement: {
        url: string;
        version: string;
        effectiveDate: Date;
    };
    privacyPolicy: string;
    termsOfService: string;
}

export interface ConsentScope {
    id: string;
    name: string;
    description: string;
    purpose: string;
    dataCategories: string[];
    retentionPeriod: string;
    required: boolean;
    gdprLegalBasis: 'consent' | 'contract' | 'legitimate_interest';
}

interface ConsentModalProps {
    integration: IntegrationConsent;
    onAccept: (acceptedScopes: string[]) => void;
    onDecline: () => void;
    isOpen: boolean;
}

export default function ConsentModal({
    integration,
    onAccept,
    onDecline,
    isOpen,
}: ConsentModalProps) {
    const [acceptedScopes, setAcceptedScopes] = useState<Set<string>>(
        new Set(integration.requiredScopes.map(s => s.id))
    );
    const [dpaAccepted, setDpaAccepted] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [showDetails, setShowDetails] = useState<string | null>(null);

    if (!isOpen) return null;

    const allRequiredAccepted = integration.requiredScopes.every(s => acceptedScopes.has(s.id));
    const canProceed = allRequiredAccepted && dpaAccepted && privacyAccepted;

    const toggleScope = (scopeId: string, required: boolean) => {
        if (required) return; // Cannot toggle required scopes

        const newAccepted = new Set(acceptedScopes);
        if (newAccepted.has(scopeId)) {
            newAccepted.delete(scopeId);
        } else {
            newAccepted.add(scopeId);
        }
        setAcceptedScopes(newAccepted);
    };

    const handleAccept = () => {
        if (!canProceed) return;
        onAccept(Array.from(acceptedScopes));
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onDecline} />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <Shield className="w-8 h-8 text-blue-600" />
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Autorisez l'accès à {integration.providerName}
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    RGPD Article 7 - Consentement libre, spécifique et éclairé
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onDecline}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[60vh]">
                        {/* Description */}
                        <div className="mb-6">
                            <p className="text-gray-700">{integration.description}</p>
                        </div>

                        {/* GDPR Notice */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-blue-900 mb-1">
                                        Protection de vos données (RGPD)
                                    </h4>
                                    <p className="text-sm text-blue-800">
                                        Votre consentement est révocable à tout moment. Nous ne collectons que les données nécessaires
                                        et les supprimons conformément aux périodes de rétention indiquées. Vos données ne seront jamais
                                        vendues à des tiers.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Required Scopes */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-orange-500" />
                                Autorisations requises
                            </h3>
                            <div className="space-y-3">
                                {integration.requiredScopes.map((scope) => (
                                    <ScopeItem
                                        key={scope.id}
                                        scope={scope}
                                        accepted={true}
                                        required={true}
                                        onToggle={() => { }}
                                        onShowDetails={() => setShowDetails(scope.id)}
                                        showingDetails={showDetails === scope.id}
                                        onHideDetails={() => setShowDetails(null)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Optional Scopes */}
                        {integration.optionalScopes.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Check className="w-5 h-5 text-green-500" />
                                    Autorisations optionnelles
                                </h3>
                                <div className="space-y-3">
                                    {integration.optionalScopes.map((scope) => (
                                        <ScopeItem
                                            key={scope.id}
                                            scope={scope}
                                            accepted={acceptedScopes.has(scope.id)}
                                            required={false}
                                            onToggle={() => toggleScope(scope.id, false)}
                                            onShowDetails={() => setShowDetails(scope.id)}
                                            showingDetails={showDetails === scope.id}
                                            onHideDetails={() => setShowDetails(null)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Legal Agreements */}
                        <div className="border-t border-gray-200 pt-6 space-y-4">
                            {/* DPA */}
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={dpaAccepted}
                                    onChange={(e) => setDpaAccepted(e.target.checked)}
                                    className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-900">
                                        J'accepte le{' '}
                                        <a
                                            href={integration.dataProcessingAgreement.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-700 underline inline-flex items-center gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Data Processing Agreement (DPA)
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                        {' '}(v{integration.dataProcessingAgreement.version})
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Accord de traitement des données conformément à l'Article 28 RGPD
                                    </p>
                                </div>
                            </label>

                            {/* Privacy Policy */}
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={privacyAccepted}
                                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                    className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-900">
                                        J'ai lu et j'accepte la{' '}
                                        <a
                                            href={integration.privacyPolicy}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-700 underline inline-flex items-center gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Politique de confidentialité
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                        {' '}et les{' '}
                                        <a
                                            href={integration.termsOfService}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-700 underline inline-flex items-center gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Conditions d'utilisation
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Warning if required scopes not accepted */}
                        {!allRequiredAccepted && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                                    <p className="text-sm text-red-800">
                                        Toutes les autorisations requises doivent être acceptées pour continuer.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                        <button
                            onClick={onDecline}
                            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Refuser
                        </button>
                        <button
                            onClick={handleAccept}
                            disabled={!canProceed}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors ${canProceed
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            Autoriser l'accès
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Scope Item Component
function ScopeItem({
    scope,
    accepted,
    required,
    onToggle,
    onShowDetails,
    showingDetails,
    onHideDetails,
}: {
    scope: ConsentScope;
    accepted: boolean;
    required: boolean;
    onToggle: () => void;
    onShowDetails: () => void;
    showingDetails: boolean;
    onHideDetails: () => void;
}) {
    return (
        <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
            <div className="flex items-start gap-3">
                {required ? (
                    <div className="mt-1">
                        <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                        </div>
                    </div>
                ) : (
                    <input
                        type="checkbox"
                        checked={accepted}
                        onChange={onToggle}
                        className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                )}
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{scope.name}</h4>
                        {required && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                                Requis
                            </span>
                        )}
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                            {scope.gdprLegalBasis === 'consent' && 'Consentement'}
                            {scope.gdprLegalBasis === 'contract' && 'Contrat'}
                            {scope.gdprLegalBasis === 'legitimate_interest' && 'Intérêt légitime'}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{scope.description}</p>

                    {/* Details Button */}
                    <button
                        onClick={showingDetails ? onHideDetails : onShowDetails}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2"
                    >
                        <Eye className="w-4 h-4" />
                        {showingDetails ? 'Masquer les détails' : 'Voir les détails RGPD'}
                    </button>

                    {/* Details Panel */}
                    {showingDetails && (
                        <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200 space-y-2">
                            <div>
                                <p className="text-xs font-semibold text-gray-700">Finalité du traitement:</p>
                                <p className="text-xs text-gray-600">{scope.purpose}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-700">Catégories de données collectées:</p>
                                <ul className="text-xs text-gray-600 list-disc list-inside">
                                    {scope.dataCategories.map((cat, idx) => (
                                        <li key={idx}>{cat}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-700">Période de rétention:</p>
                                <p className="text-xs text-gray-600">{scope.retentionPeriod}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-700">Base légale (RGPD):</p>
                                <p className="text-xs text-gray-600">
                                    {scope.gdprLegalBasis === 'consent' && 'Article 6(1)(a) - Consentement de la personne concernée'}
                                    {scope.gdprLegalBasis === 'contract' && 'Article 6(1)(b) - Exécution d\'un contrat'}
                                    {scope.gdprLegalBasis === 'legitimate_interest' && 'Article 6(1)(f) - Intérêts légitimes'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
