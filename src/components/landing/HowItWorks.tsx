'use client';
import { Mail, BrainCircuit, CheckCircle2 } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: <Mail className="w-8 h-8 text-blue-600" />,
      title: "1. Connectez votre boîte mail",
      description: "Liez votre compte Gmail ou Outlook en 1 clic. Tous les emails de vos clients arrivent directement dans MemoLib."
    },
    {
      icon: <BrainCircuit className="w-8 h-8 text-blue-600" />,
      title: "2. L'IA trie et crée les dossiers",
      description: "Notre IA spécialisée CESEDA analyse les emails, détecte les urgences (OQTF) et pré-remplit les dossiers automatiquement."
    },
    {
      icon: <CheckCircle2 className="w-8 h-8 text-blue-600" />,
      title: "3. Gérez et facturez",
      description: "Suivez vos délais, générez vos documents et facturez vos clients depuis un seul tableau de bord."
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Comment ça marche ?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Passez de la boîte mail au dossier complet en moins de 5 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
