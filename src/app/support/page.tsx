export default function SupportOnboardingPage() {
    return (
        <main className="min-h-screen bg-gray-50">
            <section className="container py-16">
                <div className="mx-auto max-w-3xl">
                    <h1 className="text-3xl font-semibold text-gray-900">Onboarding — améliorons l’image des pages</h1>
                    <p className="mt-3 text-gray-600">
                        Notre équipe onboarding vous aide à soigner la présentation, la cohérence et la clarté de vos pages pour inspirer confiance dès le premier échange.
                    </p>
                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        <a
                            href="/admin/dashboard"
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-white font-semibold shadow-sm transition hover:bg-brand-700"
                        >
                            Prendre rendez-vous
                        </a>
                        <a
                            href="/"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-5 py-3 text-gray-800 font-semibold transition hover:bg-gray-50"
                        >
                            Retour à l’accueil
                        </a>
                    </div>
                    <div className="mt-10 space-y-4">
                        <h2 className="text-xl font-semibold text-gray-900">Ce que nous améliorons</h2>
                        <ul className="list-disc pl-6 text-gray-700">
                            <li>Hiérarchie visuelle et lisibilité (titres, sous-titres, espacements)</li>
                            <li>CTA clairs et cohérents pour l’onboarding et la démo</li>
                            <li>Confiance et conformité (badges, mentions légales, RGPD)</li>
                            <li>Accessibilité et responsive design</li>
                        </ul>
                    </div>
                </div>
            </section>
        </main>
    );
}
