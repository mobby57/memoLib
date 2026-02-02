import { App } from '@octokit/app';
import { createHmac } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

// Configuration de la GitHub App
export const GITHUB_APP_CONFIG = {
  appId: process.env.GITHUB_APP_ID!,
  clientId: process.env.GITHUB_APP_CLIENT_ID!,
  clientSecret: process.env.GITHUB_APP_CLIENT_SECRET!,
  webhookSecret: process.env.GITHUB_APP_WEBHOOK_SECRET!,
  installationId: process.env.GITHUB_APP_INSTALLATION_ID!,
  privateKey: process.env.GITHUB_APP_PRIVATE_KEY_PATH
    ? readFileSync(join(process.cwd(), process.env.GITHUB_APP_PRIVATE_KEY_PATH), 'utf-8')
    : process.env.GITHUB_APP_PRIVATE_KEY!,
};

// Vérification de la signature webhook GitHub
export function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const hmac = createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  return signature === digest;
}

// Instance Octokit App
export function getGitHubApp() {
  return new App({
    appId: GITHUB_APP_CONFIG.appId,
    privateKey: GITHUB_APP_CONFIG.privateKey,
    oauth: {
      clientId: GITHUB_APP_CONFIG.clientId,
      clientSecret: GITHUB_APP_CONFIG.clientSecret,
    },
    webhooks: {
      secret: GITHUB_APP_CONFIG.webhookSecret,
    },
  });
}

// Obtenir un client Octokit pour l'installation
export async function getInstallationOctokit() {
  const app = getGitHubApp();
  return app.getInstallationOctokit(parseInt(GITHUB_APP_CONFIG.installationId));
}

// Types d'événements GitHub supportés
export type GitHubEventType =
  | 'push'
  | 'pull_request'
  | 'issues'
  | 'issue_comment'
  | 'workflow_run'
  | 'check_run'
  | 'repository'
  | 'member';

export interface GitHubWebhookPayload {
  action?: string;
  repository?: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      login: string;
      id: number;
    };
  };
  sender?: {
    login: string;
    id: number;
    email?: string;
  };
  installation?: {
    id: number;
  };
  [key: string]: any;
}
