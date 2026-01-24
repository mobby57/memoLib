/**
 * Composant: Synchronisation Dossier ↔ GitHub
 * Permet de creer/synchroniser des issues GitHub pour les dossiers
 */

'use client';

import { useState } from 'react';
import { Github, ExternalLink, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface DossierGitHubSyncProps {
  dossierId: string;
  dossierNumero: string;
  existingIssue?: {
    number: number;
    url: string;
    repo: string;
  };
}

export function DossierGitHubSync({ dossierId, dossierNumero, existingIssue }: DossierGitHubSyncProps) {
  const [repo, setRepo] = useState(existingIssue?.repo || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issue, setIssue] = useState(existingIssue);

  const handleSync = async () => {
    if (!repo.trim()) {
      setError('Veuillez entrer un repository (format: owner/repo)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/github/sync-dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dossierId,
          repo: repo.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to sync');
      }

      setIssue({
        number: data.github.issueNumber,
        url: data.github.issueUrl,
        repo: data.github.repo,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Deja synchronise
  if (issue) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Github className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Synchronise avec GitHub
                </h4>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {issue.repo} #{issue.number}
              </p>

              <a
                href={issue.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Voir sur GitHub
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Formulaire de synchronisation
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <Github className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </div>
        
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
            Synchroniser avec GitHub
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Creer une issue GitHub pour le dossier {dossierNumero}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Repository
          </label>
          <input
            type="text"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="owner/repository"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Format: proprietaire/nom-du-repo
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          onClick={handleSync}
          disabled={loading || !repo.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Synchronisation...
            </>
          ) : (
            <>
              <Github className="w-4 h-4" />
              Creer l'issue GitHub
            </>
          )}
        </button>
      </div>
    </div>
  );
}
