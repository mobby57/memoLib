const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5078';

export const API_ENDPOINTS = {
  EMAIL_INGEST: `${API_BASE_URL}/api/ingest/email`,
  CASES: `${API_BASE_URL}/api/cases`,
  CLIENTS: `${API_BASE_URL}/api/client`,
  AUTH: `${API_BASE_URL}/api/auth`,
  SEARCH: `${API_BASE_URL}/api/search`,
} as const;

export { API_BASE_URL };