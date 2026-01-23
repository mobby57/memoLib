/**
 * GitHub User Client - Authentication User-to-Server
 * Permet à l'application d'agir pour le compte d'un utilisateur GitHub
 */

import { Octokit } from '@octokit/rest';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logger } from '@/lib/logger';

export interface GitHubUserClient {
  octokit: Octokit;
  userId: string;
  username: string;
}

/**
 * Obtenir le client GitHub pour l'utilisateur connecté
 */
export async function getUserGitHubClient(): Promise<GitHubUserClient> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error('User not authenticated');
  }

  const githubAccessToken = (session as any).githubAccessToken;

  if (!githubAccessToken) {
    throw new Error('User not connected to GitHub. Please authorize the application.');
  }

  const octokit = new Octokit({
    auth: githubAccessToken,
  });

  // Vérifier le token et obtenir les infos utilisateur
  try {
    const { data: user } = await octokit.users.getAuthenticated();

    logger.debug('GitHub user client created', {
      userId: (session.user as any).id,
      githubUsername: user.login,
    });

    return {
      octokit,
      userId: (session.user as any).id,
      username: user.login,
    };
  } catch (error) {
    logger.error('Failed to authenticate GitHub user', error);
    throw new Error('Invalid GitHub token. Please re-authorize the application.');
  }
}

/**
 * Vérifier si l'utilisateur a autorisé GitHub
 */
export async function isGitHubAuthorized(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    return !!session && !!(session as any).githubAccessToken;
  } catch {
    return false;
  }
}

/**
 * Obtenir les informations du compte GitHub de l'utilisateur
 */
export async function getGitHubUserInfo() {
  const { octokit, userId } = await getUserGitHubClient();

  const { data: user } = await octokit.users.getAuthenticated();

  logger.info('Retrieved GitHub user info', {
    userId,
    githubUsername: user.login,
  });

  return {
    id: user.id,
    login: user.login,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar_url,
    bio: user.bio,
    company: user.company,
    location: user.location,
    publicRepos: user.public_repos,
    followers: user.followers,
    following: user.following,
  };
}

/**
 * Refresh le token GitHub si nécessaire
 */
export async function refreshGitHubToken(refreshToken: string) {
  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    logger.info('GitHub token refreshed successfully');

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    logger.error('Failed to refresh GitHub token', error);
    throw error;
  }
}
