/**
 * Types TypeScript alignés sur les modèles C# du backend ASP.NET Core
 * Source de vérité : Models/ dans le backend C#
 */

// === Auth ===
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
}

// === Cases (Dossiers) ===
export interface Case {
  id: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  priority: number;
  tags: string[];
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  assignedToUserId?: string;
  dueDate?: string;
  userId: string;
  clientId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCaseRequest {
  title: string;
  description?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  tags?: string[];
  priority?: number;
}

export interface CaseTimelineEvent {
  id: string;
  type: string;
  description: string;
  occurredAt: string;
  userId?: string;
}

// === Clients ===
export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  userId: string;
  createdAt: string;
}

export interface ClientDetail extends Client {
  cases: Case[];
  events: Event[];
}

// === Events (Emails ingérés) ===
export interface Event {
  id: string;
  type: string;
  fromEmail?: string;
  toEmail?: string;
  subject?: string;
  body?: string;
  occurredAt: string;
  checksum?: string;
  requiresAttention: boolean;
  sourceId: string;
}

// === Email ===
export interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  templateId?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  userId: string;
  createdAt: string;
}

// === Search ===
export interface SearchRequest {
  query: string;
  type?: string;
  limit?: number;
}

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  snippet: string;
  score: number;
}

// === Dashboard ===
export interface DashboardMetrics {
  emailsToday: number;
  totalCases: number;
  totalClients: number;
  totalEvents: number;
  openAnomalies: number;
  averageResponseTimeHours: number;
  weeklyTrend: { date: string; count: number }[];
  topClients: { clientId: string; clientName: string; caseCount: number }[];
}

// === Notifications ===
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
}

// === Attachments ===
export interface Attachment {
  id: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  eventId: string;
  uploadedAt: string;
}
