import { motion } from 'framer-motion';
import AccessibilityPanel from '../components/AccessibilityPanel';

export default function Accessibility() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            ♿ Centre d'Accessibilité
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Configurez votre expérience pour qu'elle soit adaptée à vos besoins spécifiques.
            Notre système prend en charge les personnes sourdes, muettes, aveugles et à mobilité réduite.
          </p>
        </div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-8"
        >
          <h2 className="font-bold text-blue-900 mb-2 text-lg">
            🌟 Fonctionnalités d'accessibilité universelle
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h3 className="font-semibold mb-2">👁️ Pour les aveugles:</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Synthèse vocale (TTS) pour tout le contenu</li>
                <li>Descriptions audio des actions</li>
                <li>Navigation complète au clavier</li>
                <li>Compatibilité lecteurs d'écran</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">👂 Pour les sourds:</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Transcription visuelle en temps réel</li>
                <li>Notifications visuelles</li>
                <li>Sous-titres sur tous les messages</li>
                <li>Indicateurs visuels d'état</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🗣️ Pour les muets:</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Saisie de texte partout</li>
                <li>Templates pré-définis</li>
                <li>Alternatives au vocal</li>
                <li>Communication par texte</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">⌨️ Mobilité réduite:</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Raccourcis clavier complets</li>
                <li>Navigation Tab optimisée</li>
                <li>Grandes zones cliquables</li>
                <li>Pas de double-clic requis</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Panel principal */}
        <AccessibilityPanel />

        {/* Guide d'utilisation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📖 Guide d'utilisation rapide
          </h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-green-700 mb-2">
                1️⃣ Choisissez votre profil
              </h3>
              <p className="text-sm">
                Cliquez sur l'un des profils rapides ci-dessus pour configurer automatiquement
                les paramètres optimaux pour vos besoins.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-700 mb-2">
                2️⃣ Personnalisez vos paramètres
              </h3>
              <p className="text-sm">
                Ajustez la vitesse de lecture vocale, la taille de police, le contraste, etc.
                selon vos préférences.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-purple-700 mb-2">
                3️⃣ Utilisez les raccourcis
              </h3>
              <p className="text-sm">
                Mémorisez les raccourcis clavier pour une navigation rapide sans souris.
                Tous les raccourcis sont listés en bas de page.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-orange-700 mb-2">
                4️⃣ Testez la synthèse vocale
              </h3>
              <p className="text-sm">
                Si vous êtes aveugle ou malvoyant, activez le TTS et testez-le avec le bouton
                "Tester". Tous les messages système seront prononcés.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Support */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-white rounded-lg shadow p-6 text-center"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            💬 Besoin d'aide?
          </h2>
          <p className="text-gray-600 mb-4">
            Si vous rencontrez des difficultés avec l'accessibilité, notre équipe est là pour vous aider.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
              📧 Contacter le support
            </button>
            <button className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
              📚 Documentation complète
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
