declare module '@/lib/github-app' {
  import { App } from '@octokit/app';

  /**
   * Configuration de la GitHub App
   * Chargée depuis les variables d'environnement
   */
  export const GITHUB_APP_CONFIG: {
    appId: string;
    clientId: string;
    clientSecret: string;
    webhookSecret: string;
    installationId: string;
    privateKey: string;
  };

  /**
   * Vérifie la signature d'un webhook GitHub
   * @param payload - Contenu du webhook
   * @param signature - Header de signature X-Hub-Signature-256
   * @param secret - Secret webhook
   * @returns true si la signature est valide
   */
  export function verifyWebhookSignature(
    payload: string,
    signature: string | null,
    secret: string
  ): boolean;

  /**
   * Retourne une instance configurée de Octokit App
   * @returns Instance App (@octokit/app)
   */
  export function getGitHubApp(): App<{
    clientId: string;
    clientSecret: string;
  }>;

  /**
   * Obtient un client Octokit pour l'installation GitHub App
   * @returns Promise<Octokit> - Client authentifié
   */
  export function getInstallationOctokit(): Promise<any>;

  /**
   * Types d'événements GitHub supportés par les webhooks
   */
  export type GitHubEventType =
    | 'push'
    | 'pull_request'
    | 'issues'
    | 'issue_comment'
    | 'workflow_run'
    | 'check_run'
    | 'repository'
    | 'member';

  /**
   * Structure générique d'un payload de webhook GitHub
   */
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
}
