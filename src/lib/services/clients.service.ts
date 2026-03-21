/**
 * Service Clients — communique avec le backend C# /api/client/*
 */
import { api } from '@/lib/api-client';
import type { Client, ClientDetail } from '@/lib/api-types';
import { authService } from './auth.service';

function opts() {
  return { token: authService.getToken() ?? undefined };
}

export const clientsService = {
  async getAll(): Promise<Client[]> {
    return api.get<Client[]>('/api/client', opts());
  },

  async create(data: Partial<Client>): Promise<Client> {
    return api.post<Client>('/api/client', data, opts());
  },

  async getDetail(id: string): Promise<ClientDetail> {
    return api.get<ClientDetail>(`/api/client/${id}/detail`, opts());
  },

  async update(id: string, data: Partial<Client>): Promise<Client> {
    return api.put<Client>(`/api/client/${id}`, data, opts());
  },
};
