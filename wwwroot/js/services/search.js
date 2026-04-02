export class SearchService {
  constructor(apiUrl, authService) {
    this.apiUrl = apiUrl;
    this.authService = authService;
  }

  getHeaders() {
    const token = this.authService.getToken();
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  async requestJson(path, body) {
    const res = await fetch(`${this.apiUrl}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    });

    if (res.status === 401) {
      this.authService.logout?.();
      throw new Error('Session expired');
    }

    if (!res.ok) {
      const message = await res.text();
      throw new Error(message || `HTTP ${res.status}`);
    }

    return res.json();
  }

  async searchEvents(text, limit = 500) {
    return this.requestJson('/api/search/events', { text, limit });
  }

  async semanticSearch(query) {
    return this.requestJson('/api/semantic/search', { query });
  }

  async embeddingSearch(query, limit = 10) {
    return this.requestJson('/api/embeddings/search', { query, limit });
  }

  async generateEmbeddings() {
    return this.requestJson('/api/embeddings/generate-all', {});
  }
}
