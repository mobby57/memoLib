/**
 * Service Dashboard — communique avec le backend C# /api/stats/*, /api/notifications/*
 */
import { api } from '@/lib/api-client';
import type { DashboardMetrics, Notification } from '@/lib/api-types';
import { authService } from './auth.service';

function opts() {
  return { token: authService.getToken() ?? undefined };
}

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    return api.get<DashboardMetrics>('/api/stats/dashboard', opts());
  },

  async getNotifications(): Promise<Notification[]> {
    return api.get<Notification[]>('/api/notifications', opts());
  },

  async markNotificationRead(id: string): Promise<void> {
    await api.patch(`/api/notifications/${id}/read`, {}, opts());
  },
};
