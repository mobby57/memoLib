export type ApiPagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type DossierClient = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
};

export type DossierListItem = {
  id: string;
  numero: string;
  typeDossier: string;
  description?: string | null;
  priorite?: string | null;
  statut?: string | null;
  dateCreation?: string | null;
  dateEcheance?: string | null;
  updatedAt?: string | null;
  client: DossierClient;
};

export type DossierListResponse = {
  data: DossierListItem[];
  pagination: ApiPagination;
};

export type DossierDetail = DossierListItem & {
  documents?: Array<{ id: string; title?: string | null; createdAt?: string | null }>;
  legalDeadlines?: Array<{ id: string; dueDate?: string | null; title?: string | null; status?: string | null }>;
  emails?: Array<{ id: string; subject?: string | null; receivedAt?: string | null }>;
  factures?: Array<{ id: string; numero?: string | null; montantTTC?: number | null; dateEmission?: string | null }>;
};

export type ClientsResponse = {
  data: DossierClient[];
  pagination: ApiPagination;
};

export type CreateDossierPayload = {
  numero: string;
  clientId: string;
  typeDossier: string;
  dateEcheance?: string;
  description?: string;
  priorite?: string;
};

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let body: unknown = null;

  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error: unknown }).error)
        : 'Erreur API';

    throw new ApiError(message, response.status);
  }

  return body as T;
}

export async function listDossiers(params: {
  page?: number;
  limit?: number;
  statut?: string;
  sortBy?: 'dateCreation' | 'updatedAt' | 'priorite' | 'statut';
  sortOrder?: 'asc' | 'desc';
} = {}): Promise<DossierListResponse> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.statut) search.set('statut', params.statut);
  if (params.sortBy) search.set('sortBy', params.sortBy);
  if (params.sortOrder) search.set('sortOrder', params.sortOrder);

  const query = search.toString();
  const response = await fetch(`/api/v1/dossiers${query ? `?${query}` : ''}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  return parseResponse<DossierListResponse>(response);
}

export async function getDossierById(id: string): Promise<DossierDetail> {
  const response = await fetch(`/api/v1/dossiers/${id}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  return parseResponse<DossierDetail>(response);
}

export async function createDossier(payload: CreateDossierPayload): Promise<DossierDetail> {
  const response = await fetch('/api/v1/dossiers', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<DossierDetail>(response);
}

export async function listClients(params: { page?: number; limit?: number; search?: string } = {}): Promise<ClientsResponse> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.search) search.set('search', params.search);

  const query = search.toString();
  const response = await fetch(`/api/v1/clients${query ? `?${query}` : ''}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  return parseResponse<ClientsResponse>(response);
}

export function generateDossierNumero(): string {
  const now = new Date();
  const year = now.getFullYear();
  const suffix = `${now.getTime()}`.slice(-6);
  return `DOS-${year}-${suffix}`;
}