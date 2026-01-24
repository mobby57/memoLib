/**
 * Composant: Bouton de connexion GitHub
 * Permet aux utilisateurs d'autoriser l'application a agir en leur nom
 */

'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { Github, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface GitHubUser {
  login: string;
  name: string;
  avatarUrl: string;
  publicRepos: number;
}

export function GitHubAuthButton() {
  const { data: session } = useSession();
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetchGitHubUser();
    }
  }, [session]);

  const fetchGitHubUser = async () => {
    try {
      const response = await fetch('/api/github/user');
      const data = await response.json();

      if (data.connected) {
        setGithubUser(data.user);
      }
    } catch (err) {
      console.error('Failed to fetch GitHub user:', err);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      await signIn('github', {
        callbackUrl: window.location.href,
      });
    } catch (err) {
      setError('Failed to connect to GitHub');
      setLoading(false);
    }
  };

  // Non connecte - Afficher bouton de connexion
  if (!githubUser) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Github className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Connecter GitHub
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Autorisez IA Poste Manager a agir pour votre compte GitHub pour :
            </p>
            
            <ul className="space-y-2 mb-4">
              {[
                'Creer des issues automatiquement',
                'Synchroniser vos dossiers',
                'Poster des commentaires',
                'Gerer vos repositories',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>

            {error && (
              <div className="mb-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <Github className="w-5 h-5" />
                  Autoriser GitHub
                </>
              )}
            </button>

            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Vos actions seront attribuees a votre compte avec le badge de l'application
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Connecte - Afficher profil GitHub
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start gap-4">
        <img
          src={githubUser.avatarUrl}
          alt={githubUser.name}
          className="w-12 h-12 rounded-full"
        />
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {githubUser.name}
            </h3>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            @{githubUser.login}
          </p>

          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>{githubUser.publicRepos} repositories publics</span>
          </div>

          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-400">
              [Check] Connexion active - L'application peut agir pour votre compte
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
