'use client';
import { useState } from 'react';

const TRANSLATIONS = {
  fr: {
    title: "Informations complémentaires",
    question1: "Quelle est votre situation actuelle en France ?",
    question2: "Avez-vous des enfants à charge ?",
    submit: "Envoyer à mon avocat",
    success: "Envoyé avec succès !",
  },
  ar: {
    title: "معلومات إضافية",
    question1: "ما هو وضعك الحالي في فرنسا؟",
    question2: "هل لديك أطفال تعيلهم؟",
    submit: "إرسال إلى محامي",
    success: "تم الإرسال بنجاح!",
  }
};

export default function ClientIntakeForm({ dossierId }: { dossierId: string }) {
  const [lang, setLang] = useState<'fr' | 'ar'>('fr');
  const [answers, setAnswers] = useState({ q1: '', q2: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  const handleSubmit = async () => {
    setStatus('loading');
    try {
      // Envoi à l'API qui va traduire et sauvegarder
      const response = await fetch('/api/client/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dossierId, 
          originalLang: lang, 
          answers 
        }),
      });
      if (!response.ok) {
        throw new Error('Impossible de transmettre le formulaire. Vérifiez votre accès et réessayez.');
      }
      setStatus('success');
    } catch (error) {
      setStatus('idle');
      alert(error instanceof Error ? error.message : 'Erreur lors de la transmission');
    }
  };

  return (
    <div 
      className={`max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-8 ${isRtl ? 'text-right' : 'text-left'}`} 
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Sélecteur de langue pour le client */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">{t.title}</h2>
        <select 
          value={lang} 
          onChange={(e) => setLang(e.target.value as 'fr' | 'ar')}
          className="p-2 border rounded-lg bg-slate-50 text-sm font-medium"
        >
          <option value="fr">🇫🇷 Français</option>
          <option value="ar">🇸🇾 العربية</option>
        </select>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.question1}</label>
          <input 
            type="text" 
            value={answers.q1}
            onChange={(e) => setAnswers({ ...answers, q1: e.target.value })}
            maxLength={5000}
            required
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.question2}</label>
          <input 
            type="text" 
            value={answers.q2}
            onChange={(e) => setAnswers({ ...answers, q2: e.target.value })}
            maxLength={5000}
            required
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
          />
        </div>
      </div>

      <button 
        onClick={handleSubmit}
        disabled={status === 'loading' || status === 'success'}
        className="mt-8 w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
      >
        {status === 'loading' ? '...' : status === 'success' ? t.success : t.submit}
      </button>
    </div>
  );
}
