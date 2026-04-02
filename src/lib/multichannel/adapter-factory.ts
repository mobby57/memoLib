/**
 * Factory Pattern pour Adapters Multi-Canal
 * Centralise la création et gestion des adapters
 */

import {
  DeclanAdapter,
  DocumentAdapter,
  EmailAdapter,
  FormAdapter,
  InternalAdapter,
  LinkedInAdapter,
  SlackAdapter,
  SMSAdapter,
  TeamsAdapter,
  TwitterAdapter,
  VoiceAdapter,
  WhatsAppAdapter,
} from './adapters';
import { ChannelAdapter } from './channel-service';
import { ChannelType } from './types';

/**
 * Factory pour créer le bon adapter selon le canal
 */
export class AdapterFactory {
  private static instances: Map<ChannelType, ChannelAdapter> = new Map();

  /**
   * Obtenir l'adapter pour un canal (singleton par canal)
   */
  static getAdapter(channel: ChannelType): ChannelAdapter {
    // Réutiliser instance existante si disponible
    if (this.instances.has(channel)) {
      return this.instances.get(channel)!;
    }

    // Créer nouvelle instance
    const adapter = this.createAdapter(channel);
    this.instances.set(channel, adapter);
    return adapter;
  }

  /**
   * Créer une instance d'adapter
   */
  private static createAdapter(channel: ChannelType): ChannelAdapter {
    switch (channel) {
      case 'EMAIL':
        return new EmailAdapter();
      case 'WHATSAPP':
        return new WhatsAppAdapter();
      case 'SMS':
        return new SMSAdapter();
      case 'VOICE':
        return new VoiceAdapter();
      case 'SLACK':
        return new SlackAdapter();
      case 'TEAMS':
        return new TeamsAdapter();
      case 'LINKEDIN':
        return new LinkedInAdapter();
      case 'TWITTER':
        return new TwitterAdapter();
      case 'FORM':
        return new FormAdapter();
      case 'DOCUMENT':
        return new DocumentAdapter();
      case 'DECLAN':
        return new DeclanAdapter();
      case 'INTERNAL':
        return new InternalAdapter();
      default:
        throw new Error(`Canal non supporté: ${channel}`);
    }
  }

  /**
   * Enregistrer un adapter personnalisé
   */
  static registerCustomAdapter(channel: ChannelType, adapter: ChannelAdapter): void {
    this.instances.set(channel, adapter);
  }

  /**
   * Vérifier si un canal est supporté
   */
  static isSupported(channel: string): boolean {
    const supportedChannels: ChannelType[] = [
      'EMAIL',
      'WHATSAPP',
      'SMS',
      'VOICE',
      'SLACK',
      'TEAMS',
      'LINKEDIN',
      'TWITTER',
      'FORM',
      'DOCUMENT',
      'DECLAN',
      'INTERNAL',
    ];
    return supportedChannels.includes(channel as ChannelType);
  }

  /**
   * Lister tous les canaux supportés
   */
  static getSupportedChannels(): ChannelType[] {
    return [
      'EMAIL',
      'WHATSAPP',
      'SMS',
      'VOICE',
      'SLACK',
      'TEAMS',
      'LINKEDIN',
      'TWITTER',
      'FORM',
      'DOCUMENT',
      'DECLAN',
      'INTERNAL',
    ];
  }

  /**
   * Réinitialiser cache (tests uniquement)
   */
  static resetInstances(): void {
    this.instances.clear();
  }
}
