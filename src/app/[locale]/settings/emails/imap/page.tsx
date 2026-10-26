'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function Page() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <button onClick={() => router.back()} className="flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-900">
        <ArrowLeft size={20} /> Retour
      </button>
      <div className="bg-white p-8 rounded-xl shadow-sm max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Configuration IMAP</h1>
        <p className="text-gray-600">Cette page est en cours de construction.</p>
      </div>
    </div>
  );
}
