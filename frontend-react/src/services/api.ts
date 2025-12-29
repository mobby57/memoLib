import axios from 'axios';
import { Workspace, APIResponse } from '../types/workspace';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const workspaceAPI = {
  /**
   * Récupère tous les workspaces
   */
  getAll: async (): Promise<Workspace[]> => {
    try {
      const response = await apiClient.get<{ workspaces: Workspace[] }>('/workspaces');
      return response.data.workspaces || [];
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      throw error;
    }
  },

  /**
   * Récupère un workspace par ID
   */
  getById: async (id: string): Promise<Workspace> => {
    try {
      const response = await apiClient.get<Workspace>(`/workspaces/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching workspace ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crée un nouveau workspace
   */
  create: async (data: Partial<Workspace>): Promise<Workspace> => {
    try {
      const response = await apiClient.post<Workspace>('/workspaces', data);
      return response.data;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  },

  /**
   * Met à jour un workspace
   */
  update: async (id: string, data: Partial<Workspace>): Promise<Workspace> => {
    try {
      const response = await apiClient.put<Workspace>(`/workspaces/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating workspace ${id}:`, error);
      throw error;
    }
  },

  /**
   * Supprime un workspace
   */
  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/workspaces/${id}`);
    } catch (error) {
      console.error(`Error deleting workspace ${id}:`, error);
      throw error;
    }
  },

  /**
   * Health check de l'API
   */
  healthCheck: async (): Promise<boolean> => {
    try {
      await apiClient.get('/health');
      return true;
    } catch {
      return false;
    }
  },
};

export default apiClient;
