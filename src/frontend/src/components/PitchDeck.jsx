import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

const PitchDeck = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);

  const slides = [
    {
      id: 1,
      title: "🦄 IAPosteManager",
      subtitle: "L'IA qui démocratise la communication professionnelle",
      content: (
        <div className="text-center">
          <div className="text-8xl mb-8">🦄</div>
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6">
            IAPosteManager
          </h1>
          <p className="text-2xl text-gray-600 mb-8">
            La prochaine licorne française qui révolutionne la communication mondiale
          </p>
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-8 py-4 rounded-full inline-block font-bold text-xl">
            Valorisation Cible: $5B+ en 2027
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "🎯 Le Problème",
      subtitle: "8 milliards d'humains, 1 barrière: la communication",
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-8">Le Défi Mondial</h2>
            <div className="space-y-6">
              <div className="bg-red-50 border-l-4 border-red-500 p-6">
                <h3 className="text-xl font-bold text-red-900 mb-2">1.3 milliards</h3>
                <p className="text-red-700">de personnes handicapées exclues du numérique</p>
              </div>
              <div className="bg-orange-50 border-l-4 border-orange-500 p-6">
                <h3 className="text-xl font-bold text-orange-900 mb-2">750 millions</h3>
                <p className="text-orange-700">d'analphabètes sans accès aux outils pro</p>
              </div>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6">
                <h3 className="text-xl font-bold text-yellow-900 mb-2">4.6 milliards</h3>
                <p className="text-yellow-700">d'utilisateurs email frustrés par la complexité</p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-9xl mb-6">😔</div>
            <p className="text-xl text-gray-600">
              La communication professionnelle reste un privilège pour quelques-uns
            </p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "💡 Notre Solution",
      subtitle: "IA révolutionnaire + Accessibilité totale = Démocratisation",
      content: (
        <div>
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">6 Innovations Révolutionnaires</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-bold mb-2">IA Émotionnelle</h3>
              <p className="text-sm opacity-90">+340% conversion</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">🎤</div>
              <h3 className="text-xl font-bold mb-2">Interface Vocale</h3>
              <p className="text-sm opacity-90">95 langues + clonage</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">♿</div>
              <h3 className="text-xl font-bold mb-2">Accessibilité</h3>
              <p className="text-sm opacity-90">1.3B personnes</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold mb-2">Agents IA</h3>
              <p className="text-sm opacity-90">89% automatisation</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2">Prédiction</h3>
              <p className="text-sm opacity-90">94% précision</p>
            </div>
            <div className="bg-gradient-to-br from-gray-500 to-slate-500 text-white rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-xl font-bold mb-2">Sécurité</h3>
              <p className="text-sm opacity-90">Quantique</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "🚀 Call to Action",
      subtitle: "Rejoignez la révolution de la communication IA",
      content: (
        <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-8">🦄 Investissez dans la Licorne</h2>
          
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl text-white p-12 mb-12">
            <h3 className="text-3xl font-bold mb-6">Opportunité Unique</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="text-4xl font-bold">$500B</div>
                <div className="text-purple-200">Marché TAM</div>
              </div>
              <div>
                <div className="text-4xl font-bold">18 mois</div>
                <div className="text-purple-200">Fenêtre Critique</div>
              </div>
              <div>
                <div className="text-4xl font-bold">First</div>
                <div className="text-purple-200">Mover Advantage</div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">📧 Contact</h3>
              <p className="text-gray-600 mb-4">Prenons rendez-vous pour discuter</p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold">
                Planifier RDV
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">🎥 Démo Live</h3>
              <p className="text-gray-600 mb-4">Voyez les innovations en action</p>
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold">
                Demander Démo
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">📊 Due Diligence</h3>
              <p className="text-gray-600 mb-4">Accès aux métriques détaillées</p>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold">
                Data Room
              </button>
            </div>
          </div>
          
          <div className="text-2xl text-gray-600 italic">
            "Dans 10 ans, on se souviendra de cette conversation comme le moment où tout a commencé..."
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isPresenting ? 'bg-black' : 'bg-gradient-to-br from-gray-50 to-blue-50'
    }`}>
      {/* Mode présentation */}
      {isPresenting ? (
        <div className="h-screen flex items-center justify-center p-8">
          <div className="w-full max-w-7xl">
            {slides[currentSlide].content}
          </div>
        </div>
      ) : (
        /* Mode normal */
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🦄 Pitch Deck IAPosteManager
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              La prochaine licorne française - Présentation investisseurs
            </p>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setIsPresenting(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-bold flex items-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>Mode Présentation</span>
              </button>
            </div>
          </div>

          {/* Slide actuelle */}
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden mb-8">
            <div className="h-[600px] p-12 overflow-y-auto">
              {slides[currentSlide].content}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={prevSlide}
              className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Précédent</span>
            </button>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 mb-2">
                {slides[currentSlide].title}
              </div>
              <div className="text-sm text-gray-600">
                {currentSlide + 1} / {slides.length}
              </div>
            </div>
            
            <button
              onClick={nextSlide}
              className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2"
            >
              <span>Suivant</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Miniatures */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => goToSlide(index)}
                className={`aspect-video rounded-lg border-2 p-2 text-xs font-medium transition-all ${
                  currentSlide === index
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {slide.id}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contrôles mode présentation */}
      {isPresenting && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-white/10 backdrop-blur-lg rounded-full px-6 py-3">
          <button
            onClick={prevSlide}
            className="text-white hover:text-gray-300 p-2"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="text-white font-medium">
            {currentSlide + 1} / {slides.length}
          </div>
          
          <button
            onClick={nextSlide}
            className="text-white hover:text-gray-300 p-2"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => setIsPresenting(false)}
            className="text-white hover:text-gray-300 ml-4 px-4 py-2 bg-white/20 rounded-full"
          >
            Quitter
          </button>
        </div>
      )}
    </div>
  );
};

export default PitchDeck;