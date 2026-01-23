'use client';

import { useState } from 'react';

export default function TestLoginPage() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    setResult(`<p>Envoi des données...</p>
      <p>Email: ${email}</p>
      <p>Password: ${password ? '***' : 'VIDE!'}</p>`);
    
    try {
      // Obtenir le CSRF token
      const csrfRes = await fetch('/api/auth/csrf');
      const { csrfToken } = await csrfRes.json();
      
      // Envoyer la requête de connexion
      const response = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          csrfToken: csrfToken,
          json: true
        })
      });
      
      const data = await response.json();
      
      setResult(prev => prev + `<hr>
        <p><strong>Status:</strong> ${response.status}</p>
        <p><strong>Response:</strong></p>
        <pre>${JSON.stringify(data, null, 2)}</pre>`);
        
      if (response.ok && data.url) {
        setResult(prev => prev + `<p style="color: green;">✅ Connexion réussie!</p>`);
        setTimeout(() => {
          window.location.href = data.url;
        }, 2000);
      } else {
        setResult(prev => prev + `<p style="color: red;">❌ Échec de connexion</p>`);
      }
    } catch (error: any) {
      setResult(prev => prev + `<hr><p style="color: red;"><strong>Erreur:</strong> ${error.message}</p>`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test de connexion direct</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email:</label>
          <input 
            type="email" 
            name="email" 
            defaultValue="superadmin@iapostemanager.com" 
            required
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Password:</label>
          <input 
            type="password" 
            name="password" 
            defaultValue="SuperAdmin2026!" 
            required
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      {result && (
        <div 
          className="mt-6 p-4 border border-gray-300 rounded bg-gray-50"
          dangerouslySetInnerHTML={{ __html: result }}
        />
      )}
    </div>
  );
}
