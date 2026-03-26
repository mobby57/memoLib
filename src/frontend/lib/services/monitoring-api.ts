export type EmailIngestionHealthStatus = 'healthy' | 'degraded' | 'critical';

export type EmailIngestionMonitoringResponse = {
  success: boolean;
  status: EmailIngestionHealthStatus;
  data: {
    rates: {
      successRate: string;
      duplicateRate: string;
      errorRate: string;
      attachmentRate: string;
    };
    health: {
      status: EmailIngestionHealthStatus;
      reasons: string[];
    };
  };
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

export async function getEmailIngestionMonitoring(): Promise<EmailIngestionMonitoringResponse> {
  const response = await fetch('/api/monitoring/email-ingestion', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  return parseResponse<EmailIngestionMonitoringResponse>(response);
}
