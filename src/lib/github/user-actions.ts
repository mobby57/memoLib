/**
 * GitHub User Actions - Agir pour le compte d'un utilisateur
 * Toutes les actions sont attribuées à l'utilisateur avec le badge de l'application
 */

import { getUserGitHubClient } from './user-client';
import { logger, logDossierAction } from '@/lib/logger';

/**
 * Créer une issue GitHub pour le compte de l'utilisateur
 */
export async function createIssueAsUser(
  repo: string,
  title: string,
  body: string,
  labels?: string[],
  assignees?: string[]
) {
  const { octokit, userId, username } = await getUserGitHubClient();

  const [owner, repoName] = repo.split('/');

  if (!owner || !repoName) {
    throw new Error('Invalid repository format. Use: owner/repo');
  }

  try {
    const { data } = await octokit.issues.create({
      owner,
      repo: repoName,
      title,
      body,
      labels,
      assignees,
    });

    logger.info('GitHub issue created as user', {
      userId,
      githubUsername: username,
      issueNumber: data.number,
      issueUrl: data.html_url,
      repo,
    });

    return {
      number: data.number,
      url: data.html_url,
      state: data.state,
      createdAt: data.created_at,
      author: data.user?.login, // Username de l'utilisateur
    };
  } catch (error) {
    logger.error('Failed to create GitHub issue as user', error, {
      userId,
      repo,
      title,
    });
    throw error;
  }
}

/**
 * Poster un commentaire sur une issue pour le compte de l'utilisateur
 */
export async function commentAsUser(
  repo: string,
  issueNumber: number,
  comment: string
) {
  const { octokit, userId, username } = await getUserGitHubClient();

  const [owner, repoName] = repo.split('/');

  try {
    const { data } = await octokit.issues.createComment({
      owner,
      repo: repoName,
      issue_number: issueNumber,
      body: comment,
    });

    logger.info('GitHub comment posted as user', {
      userId,
      githubUsername: username,
      issueNumber,
      commentId: data.id,
      repo,
    });

    return {
      id: data.id,
      url: data.html_url,
      createdAt: data.created_at,
      author: data.user?.login,
    };
  } catch (error) {
    logger.error('Failed to post GitHub comment as user', error, {
      userId,
      repo,
      issueNumber,
    });
    throw error;
  }
}

/**
 * Mettre à jour une issue pour le compte de l'utilisateur
 */
export async function updateIssueAsUser(
  repo: string,
  issueNumber: number,
  updates: {
    title?: string;
    body?: string;
    state?: 'open' | 'closed';
    labels?: string[];
    assignees?: string[];
  }
) {
  const { octokit, userId, username } = await getUserGitHubClient();

  const [owner, repoName] = repo.split('/');

  try {
    const { data } = await octokit.issues.update({
      owner,
      repo: repoName,
      issue_number: issueNumber,
      ...updates,
    });

    logger.info('GitHub issue updated as user', {
      userId,
      githubUsername: username,
      issueNumber,
      updates,
      repo,
    });

    return {
      number: data.number,
      url: data.html_url,
      state: data.state,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    logger.error('Failed to update GitHub issue as user', error, {
      userId,
      repo,
      issueNumber,
    });
    throw error;
  }
}

/**
 * Créer un déploiement pour le compte de l'utilisateur
 */
export async function createDeploymentAsUser(
  repo: string,
  ref: string,
  environment: string = 'production',
  description?: string
) {
  const { octokit, userId, username } = await getUserGitHubClient();

  const [owner, repoName] = repo.split('/');

  try {
    const { data } = await octokit.repos.createDeployment({
      owner,
      repo: repoName,
      ref,
      environment,
      description,
      auto_merge: false,
      required_contexts: [],
    });

    logger.info('GitHub deployment created as user', {
      userId,
      githubUsername: username,
      deploymentId: data.id,
      environment,
      ref,
      repo,
    });

    return {
      id: data.id,
      url: data.url,
      environment: data.environment,
      ref: data.ref,
      createdAt: data.created_at,
    };
  } catch (error) {
    logger.error('Failed to create GitHub deployment as user', error, {
      userId,
      repo,
      ref,
      environment,
    });
    throw error;
  }
}

/**
 * Créer une Pull Request pour le compte de l'utilisateur
 */
export async function createPullRequestAsUser(
  repo: string,
  title: string,
  head: string,
  base: string,
  body?: string
) {
  const { octokit, userId, username } = await getUserGitHubClient();

  const [owner, repoName] = repo.split('/');

  try {
    const { data } = await octokit.pulls.create({
      owner,
      repo: repoName,
      title,
      head,
      base,
      body,
    });

    logger.info('GitHub PR created as user', {
      userId,
      githubUsername: username,
      prNumber: data.number,
      prUrl: data.html_url,
      repo,
    });

    return {
      number: data.number,
      url: data.html_url,
      state: data.state,
      createdAt: data.created_at,
      author: data.user?.login,
    };
  } catch (error) {
    logger.error('Failed to create GitHub PR as user', error, {
      userId,
      repo,
      title,
    });
    throw error;
  }
}

/**
 * Lister les repositories de l'utilisateur
 */
export async function listUserRepositories(
  visibility: 'all' | 'public' | 'private' = 'all',
  sort: 'created' | 'updated' | 'pushed' | 'full_name' = 'updated'
) {
  const { octokit, userId } = await getUserGitHubClient();

  try {
    const { data } = await octokit.repos.listForAuthenticatedUser({
      visibility,
      sort,
      direction: 'desc',
      per_page: 100,
    });

    logger.info('Listed user repositories', {
      userId,
      count: data.length,
      visibility,
    });

    return data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      description: repo.description,
      url: repo.html_url,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      updatedAt: repo.updated_at,
    }));
  } catch (error) {
    logger.error('Failed to list user repositories', error, { userId });
    throw error;
  }
}

/**
 * INTÉGRATION MÉTIER : Synchroniser un dossier avec GitHub
 */
export async function syncDossierToGitHub(
  repo: string,
  dossier: {
    numero: string;
    client: string;
    typeDossier: string;
    statut: string;
    priorite: string;
    description?: string;
  },
  tenantId: string,
  userId: string
) {
  try {
    const labels = [
      `type:${dossier.typeDossier}`,
      `priorite:${dossier.priorite}`,
      `statut:${dossier.statut}`,
    ];

    const body = `
**Client** : ${dossier.client}
**Type** : ${dossier.typeDossier}
**Statut** : ${dossier.statut}
**Priorité** : ${dossier.priorite}

${dossier.description || ''}

---
*Synchronisé depuis IA Poste Manager*
    `.trim();

    const issue = await createIssueAsUser(
      repo,
      `[DOSSIER] ${dossier.numero} - ${dossier.client}`,
      body,
      labels
    );

    // Log l'action métier
    logDossierAction(
      'GITHUB_SYNC',
      userId,
      tenantId,
      dossier.numero,
      {
        githubIssueNumber: issue.number,
        githubIssueUrl: issue.url,
        repo,
      }
    );

    return issue;
  } catch (error) {
    logger.error('Failed to sync dossier to GitHub', error, {
      dossierNumero: dossier.numero,
      repo,
      userId,
    });
    throw error;
  }
}

/**
 * INTÉGRATION MÉTIER : Mettre à jour une issue GitHub quand le dossier change
 */
export async function updateDossierOnGitHub(
  repo: string,
  issueNumber: number,
  changes: {
    statut?: string;
    priorite?: string;
    description?: string;
  },
  tenantId: string,
  userId: string
) {
  try {
    const comment = `
📋 **Mise à jour du dossier**

${changes.statut ? `- Statut : ${changes.statut}` : ''}
${changes.priorite ? `- Priorité : ${changes.priorite}` : ''}
${changes.description ? `\n${changes.description}` : ''}

---
*Mise à jour automatique depuis IA Poste Manager*
    `.trim();

    const result = await commentAsUser(repo, issueNumber, comment);

    logDossierAction(
      'GITHUB_UPDATE',
      userId,
      tenantId,
      issueNumber.toString(),
      {
        githubCommentId: result.id,
        changes,
        repo,
      }
    );

    return result;
  } catch (error) {
    logger.error('Failed to update dossier on GitHub', error, {
      issueNumber,
      repo,
      userId,
    });
    throw error;
  }
}
