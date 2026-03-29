export type TaskAssignee = {
  id: string;
  name?: string | null;
  email?: string | null;
};

export type TaskApiItem = {
  id: string;
  title?: string | null;
  status?: string | null;
  priority?: string | null;
  dueDate?: string | null;
  createdAt?: string | null;
  assignedToId?: string | null;
  assignedTo?: TaskAssignee | null;
  case?: {
    id?: string | null;
    numero?: string | null;
    title?: string | null;
  } | null;
};

export type ListTasksResponse = {
  data: TaskApiItem[];
  assignees?: TaskAssignee[];
};

export type ListTasksParams = {
  sortBy?: 'dueDate' | 'createdAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
  includeAssignees?: boolean;
};

export type UpdateTaskPayload = {
  status?: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignedToId?: string | null;
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

export async function listTasks(params: ListTasksParams = {}): Promise<ListTasksResponse> {
  const search = new URLSearchParams();
  if (params.sortBy) search.set('sortBy', params.sortBy);
  if (params.sortOrder) search.set('sortOrder', params.sortOrder);
  if (params.includeAssignees) search.set('includeAssignees', 'true');

  const query = search.toString();
  const response = await fetch(`/api/v1/tasks${query ? `?${query}` : ''}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  return parseResponse<ListTasksResponse>(response);
}

export async function updateTask(taskId: string, payload: UpdateTaskPayload): Promise<TaskApiItem> {
  const response = await fetch(`/api/v1/tasks/${taskId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<TaskApiItem>(response);
}