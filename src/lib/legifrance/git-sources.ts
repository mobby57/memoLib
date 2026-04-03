/**
 * Synchronisation des depots GitHub Legifrance
 *
 * Sources:
 * - https://github.com/legifrance/La-Constitution.git
 * - https://github.com/legifrance/Les-codes-en-vigueur.git
 *
 * Clone/pull les depots en local pour recherche offline
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

export interface GitSource {
  name: string;
  repo: string;
  localPath: string;
  description: string;
}

const DATA_DIR = process.env.LEGIFRANCE_DATA_DIR
  || path.join(process.cwd(), 'data', 'legifrance');

export const GIT_SOURCES: GitSource[] = [
  {
    name: 'constitution',
    repo: 'https://github.com/legifrance/La-Constitution.git',
    localPath: path.join(DATA_DIR, 'La-Constitution'),
    description: 'Constitution de la Republique francaise',
  },
  {
    name: 'codes',
    repo: 'https://github.com/legifrance/Les-codes-en-vigueur.git',
    localPath: path.join(DATA_DIR, 'Les-codes-en-vigueur'),
    description: 'Tous les codes en vigueur (civil, penal, travail, CESEDA...)',
  },
];

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function runGit(cmd: string, cwd?: string): string {
  try {
    return execSync(cmd, {
      cwd,
      encoding: 'utf-8',
      timeout: 300_000, // 5 min max (gros repos)
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (err: any) {
    throw new Error(`git error: ${err.stderr || err.message}`);
  }
}

export interface SyncResult {
  source: string;
  action: 'cloned' | 'updated' | 'up-to-date' | 'error';
  commitHash?: string;
  error?: string;
}

/**
 * Clone ou met a jour un depot
 */
export function syncSource(source: GitSource): SyncResult {
  ensureDir(DATA_DIR);

  try {
    if (!existsSync(path.join(source.localPath, '.git'))) {
      // Clone initial (shallow pour economiser l'espace)
      runGit(`git clone --depth 1 "${source.repo}" "${source.localPath}"`);
      const hash = runGit('git rev-parse --short HEAD', source.localPath);
      return { source: source.name, action: 'cloned', commitHash: hash };
    }

    // Pull les changements
    const hashBefore = runGit('git rev-parse --short HEAD', source.localPath);
    runGit('git pull --ff-only', source.localPath);
    const hashAfter = runGit('git rev-parse --short HEAD', source.localPath);

    return {
      source: source.name,
      action: hashBefore === hashAfter ? 'up-to-date' : 'updated',
      commitHash: hashAfter,
    };
  } catch (err: any) {
    return { source: source.name, action: 'error', error: err.message };
  }
}

/**
 * Synchronise tous les depots Legifrance
 */
export function syncAllSources(): SyncResult[] {
  return GIT_SOURCES.map(syncSource);
}

/**
 * Verifie si les depots sont disponibles localement
 */
export function getSourcesStatus(): Array<GitSource & { available: boolean; commitHash?: string }> {
  return GIT_SOURCES.map((s) => {
    const gitDir = path.join(s.localPath, '.git');
    const available = existsSync(gitDir);
    let commitHash: string | undefined;
    if (available) {
      try { commitHash = runGit('git rev-parse --short HEAD', s.localPath); } catch { /* ignore */ }
    }
    return { ...s, available, commitHash };
  });
}
