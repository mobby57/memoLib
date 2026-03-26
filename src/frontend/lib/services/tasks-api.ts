export type TaskApiItem = {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  dueDate?: string | null;
  assignedToId?: string | null;
  assignedTo?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;
  case?: {
    id?: string;
    numero?: string | null;
    title?: string | null;
  } | null;
};

export type TasksApiResponse = {
  data: TaskApiItem[];
  assignees?: TaskAssignee[];
};

export type TaskAssignee = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string;
};

export type UpdateTaskPayload = {
  status?: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignedToId?: string;
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

export async function listTasks(params: {
  status?: string;
  priority?: string;
  sortBy?: 'dueDate' | 'createdAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
  includeAssignees?: boolean;
} = {}): Promise<TasksApiResponse> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.priority) search.set('priority', params.priority);
  if (params.sortBy) search.set('sortBy', params.sortBy);
  if (params.sortOrder) search.set('sortOrder', params.sortOrder);
  if (params.includeAssignees) search.set('includeAssignees', '1');

  const query = search.toString();
  const response = await fetch(`/api/v1/tasks${query ? `?${query}` : ''}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  return parseResponse<TasksApiResponse>(response);
}

export async function updateTask(id: string, payload: UpdateTaskPayload): Promise<TaskApiItem> {
  const response = await fetch(`/api/v1/tasks/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<TaskApiItem>(response);
}
