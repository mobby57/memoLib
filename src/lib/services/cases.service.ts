/**
 * Service Cases (Dossiers) — communique avec le backend C# /api/cases/*
 */
import { api } from '@/lib/api-client';
import type { Case, CreateCaseRequest, CaseTimelineEvent } from '@/lib/api-types';
import { authService } from './auth.service';

function opts() {
  return { token: authService.getToken() ?? undefined };
}

export const casesService = {
  async getAll(): Promise<Case[]> {
    return api.get<Case[]>('/api/cases', opts());
  },

  async getById(id: string): Promise<Case> {
    return api.get<Case>(`/api/cases/${id}`, opts());
  },

  async create(data: CreateCaseRequest): Promise<Case> {
    return api.post<Case>('/api/cases', data, opts());
  },

  async getTimeline(id: string): Promise<CaseTimelineEvent[]> {
    return api.get<CaseTimelineEvent[]>(`/api/cases/${id}/timeline`, opts());
  },

  async updateStatus(id: string, status: string): Promise<void> {
    await api.patch(`/api/cases/${id}/status`, { status }, opts());
  },

  async assign(id: string, assignedToUserId: string): Promise<void> {
    await api.patch(`/api/cases/${id}/assign`, { assignedToUserId }, opts());
  },

  async updateTags(id: string, tags: string[]): Promise<void> {
    await api.patch(`/api/cases/${id}/tags`, { tags }, opts());
  },

  async updatePriority(id: string, priority: number, dueDate?: string): Promise<void> {
    await api.patch(`/api/cases/${id}/priority`, { priority, dueDate }, opts());
  },

  async filter(params: Record<string, string>): Promise<Case[]> {
    const qs = new URLSearchParams(params).toString();
    return api.get<Case[]>(`/api/cases/filter?${qs}`, opts());
  },
};
