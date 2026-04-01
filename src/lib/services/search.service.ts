/**
 * Service Search — communique avec le backend C# /api/search/*, /api/embeddings/*, /api/semantic/*
 */
import { api } from '@/lib/api-client';
import type { SearchRequest, SearchResult } from '@/lib/api-types';
import { authService } from './auth.service';

function opts() {
  return { token: authService.getToken() ?? undefined };
}

export const searchService = {
  async searchEvents(data: SearchRequest): Promise<SearchResult[]> {
    return api.post<SearchResult[]>('/api/search/events', data, opts());
  },

  async searchEmbeddings(data: SearchRequest): Promise<SearchResult[]> {
    return api.post<SearchResult[]>('/api/embeddings/search', data, opts());
  },

  async searchSemantic(data: SearchRequest): Promise<SearchResult[]> {
    return api.post<SearchResult[]>('/api/semantic/search', data, opts());
  },
};
