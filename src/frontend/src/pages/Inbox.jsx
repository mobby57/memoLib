import React from 'react';

const Inbox = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">📧 Boîte de Réception</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">🚧 Fonctionnalité en développement</h2>
        <p className="text-gray-700 mb-4">
          La gestion de la boîte de réception sera bientôt disponible avec :
        </p>
        
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>📨 Réception automatique des emails</li>
          <li>🔍 Filtrage et tri intelligent</li>
          <li>🤖 Réponses automatiques IA</li>
          <li>📋 Gestion des priorités</li>
          <li>🔔 Notifications en temps réel</li>
        </ul>
        
        <div className="mt-6">
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => window.history.back()}
          >
            ← Retour
          </button>
        </div>
      </div>
    </div>
  );
};

export default Inbox;