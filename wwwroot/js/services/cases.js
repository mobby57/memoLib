export class CaseService {
  constructor(apiUrl, authService) {
    this.apiUrl = apiUrl;
    this.authService = authService;
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30s
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authService.getToken()}`
    };
  }

  async fetchWithRetry(url, options, retries = 2) {
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await fetch(url, options);
        if (res.status === 401) {
          this.authService.logout();
          const error = new Error('Session expired');
          error.status = 401;
          throw error;
        }
        if (!res.ok) {
          const error = new Error(`HTTP ${res.status}`);
          error.status = res.status;
          throw error;
        }
        return res;
      } catch (err) {
        if (err.name === 'AbortError') throw err;
        const status = err.status;
        const shouldRetry = status === undefined || status === 429 || status >= 500;
        if (!shouldRetry) throw err;
        if (i === retries) throw err;
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }

  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.time < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, { data, time: Date.now() });
  }

  async getCases(useCache = true) {
    const cacheKey = 'cases';
    if (useCache) {
      const cached = this.getCached(cacheKey);
      if (cached) return cached;
    }

    const res = await this.fetchWithRetry(`${this.apiUrl}/api/cases`, {
      headers: { 'Authorization': `Bearer ${this.authService.getToken()}` }
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : [];
    this.setCache(cacheKey, data);
    return data;
  }

  async getCaseById(id, useCache = true) {
    const cacheKey = `case-${id}`;
    if (useCache) {
      const cached = this.getCached(cacheKey);
      if (cached) return cached;
    }

    const res = await this.fetchWithRetry(`${this.apiUrl}/api/cases/${id}`, {
      headers: { 'Authorization': `Bearer ${this.authService.getToken()}` }
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    this.setCache(cacheKey, data);
    return data;
  }

  async getTimeline(id) {
    const res = await this.fetchWithRetry(`${this.apiUrl}/api/cases/${id}/timeline`, {
      headers: { 'Authorization': `Bearer ${this.authService.getToken()}` }
    });
    const text = await res.text();
    return text ? JSON.parse(text) : [];
  }

  async createCase(title) {
    const res = await this.fetchWithRetry(`${this.apiUrl}/api/cases`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ title })
    });
    this.cache.clear();
    return res.json();
  }

  async updateStatus(id, status) {
    const res = await this.fetchWithRetry(`${this.apiUrl}/api/cases/${id}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status })
    });
    this.cache.delete(`case-${id}`);
    this.cache.delete('cases');
    return res.json();
  }

  async mergeDuplicates() {
    const res = await this.fetchWithRetry(`${this.apiUrl}/api/cases/merge-duplicates`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.authService.getToken()}` }
    });
    this.cache.clear();
    return res.json();
  }

  clearCache() {
    this.cache.clear();
  }
}
