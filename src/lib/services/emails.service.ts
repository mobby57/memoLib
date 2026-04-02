/**
 * Service Emails — communique avec le backend C# /api/email/*, /api/ingest/*, /api/email-scan/*
 */
import { api } from '@/lib/api-client';
import type { Event, SendEmailRequest, EmailTemplate } from '@/lib/api-types';
import { authService } from './auth.service';

function opts() {
  return { token: authService.getToken() ?? undefined };
}

export const emailsService = {
  async ingest(emailData: Record<string, unknown>): Promise<Event> {
    return api.post<Event>('/api/ingest/email', emailData, opts());
  },

  async scanManual(): Promise<{ count: number }> {
    return api.post<{ count: number }>('/api/email-scan/manual', {}, opts());
  },

  async send(data: SendEmailRequest): Promise<void> {
    await api.post('/api/email/send', data, opts());
  },

  async getTemplates(): Promise<EmailTemplate[]> {
    return api.get<EmailTemplate[]>('/api/email/templates', opts());
  },

  async createTemplate(data: Omit<EmailTemplate, 'id' | 'userId' | 'createdAt'>): Promise<EmailTemplate> {
    return api.post<EmailTemplate>('/api/email/templates', data, opts());
  },
};
