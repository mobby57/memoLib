export interface User {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'PARTNER' | 'LAWYER' | 'PARALEGAL' | 'SECRETARY' | 'INTERN' | 'AVOCAT';
  createdAt: Date;
}

export interface Case {
  id: string;
  title: string;
  clientId?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  priority?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  createdAt: Date;
}

export interface Event {
  id: string;
  caseId?: string;
  occurredAt: Date;
  rawPayload: string;
  validationFlags?: string;
  requiresAttention: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: string;
  plan?: string;
}
