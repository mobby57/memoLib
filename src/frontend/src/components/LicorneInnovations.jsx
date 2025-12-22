import React, { useState, useEffect } from 'react';

const LicorneInnovations = () => {
  const [currentFeature, setCurrentFeature] = useState(0);
  
  const features = [
    {
      title: "🤖 IA Émotionnelle",
      description: "Détection automatique de l'humeur et adaptation du ton",
      icon: "🧠"
    },
    {
      title: "🎤 Interface Vocale Universelle",
      description: "Contrôle vocal complet avec clonage de voix",
      icon: "🗣️"
    },
    {
      title: "♿ Accessibilité Totale",
      description: "Support complet pour tous les handicaps",
      icon: "🌟"
    },
    {
      title: "🎭 Personnalités IA",
      description: "Clonage de personnalités célèbres",
      icon: "👑"
    },
    {
      title: "🎯 Hyper-Personnalisation",
      description: "ADN numérique et micro-segmentation",
      icon: "🔬"
    },
    {
      title: "🎬 Génération Vidéo",
      description: "Création automatique de vidéos marketing",
      icon: "🎥"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 flex items-center justify-center overflow-hidden">
      {/* Particules animées */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
        {/* Logo Licorne */}
        <div className="mb-8">
          <div className="text-8xl mb-4 animate-bounce">🦄</div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
            MODE LICORNE
          </h1>
          <p className="text-2xl text-pink-200 mb-8">
            ACTIVÉ
          </p>
        </div>

        {/* Fonctionnalités en rotation */}
        <div className="mb-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <div className="text-6xl mb-4">
              {features[currentFeature].icon}
            </div>
            <h2 className="text-3xl font-bold mb-4">
              {features[currentFeature].title}
            </h2>
            <p className="text-xl text-pink-200">
              {features[currentFeature].description}
            </p>
          </div>
        </div>

        {/* Métriques Licorne */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-yellow-400">10M€</div>
            <div className="text-sm text-pink-200">Valorisation 2024</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-green-400">100K</div>
            <div className="text-sm text-pink-200">Utilisateurs cibles</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-blue-400">200</div>
            <div className="text-sm text-pink-200">Intégrations</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-purple-400">95</div>
            <div className="text-sm text-pink-200">Langues supportées</div>
          </div>
        </div>

        {/* Technologies */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-6">Technologies de Pointe</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              "GPT-4o", "Claude 3", "Gemini Pro", "Sora 2", "DALL-E 3",
              "Whisper", "TTS", "Computer Vision", "Quantum Encryption"
            ].map((tech, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-sm font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <p className="text-xl mb-6 text-pink-200">
            🚀 Prêt à révolutionner l'email avec l'IA ?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full font-bold text-lg hover:scale-105 transform transition-all shadow-2xl">
              🦄 Démarrer l'aventure
            </button>
            <button className="px-8 py-4 bg-white/20 backdrop-blur-lg rounded-full font-bold text-lg hover:bg-white/30 transition-all border border-white/30">
              📧 Voir la démo
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-pink-300 text-sm">
            ✨ IAPosteManager v3.0 - Licorne Edition ✨
          </p>
          <p className="text-pink-400 text-xs mt-2">
            "Démocratiser l'IA pour l'humanité" 🌍
          </p>
        </div>
      </div>

      {/* Effets visuels */}
      <div className="absolute top-10 left-10 text-6xl animate-spin-slow">⭐</div>
      <div className="absolute top-20 right-20 text-4xl animate-pulse">✨</div>
      <div className="absolute bottom-20 left-20 text-5xl animate-bounce">💎</div>
      <div className="absolute bottom-10 right-10 text-3xl animate-ping">🌟</div>
    </div>
  );
};

export default LicorneInnovations;