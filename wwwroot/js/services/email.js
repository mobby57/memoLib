export class EmailService {
  constructor(apiUrl, authService) {
    this.apiUrl = apiUrl;
    this.authService = authService;
    this.abortControllers = new Map();
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

  cancelRequest(key) {
    const controller = this.abortControllers.get(key);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(key);
    }
  }

  async ingestEmail(data) {
    const res = await this.fetchWithRetry(`${this.apiUrl}/api/ingest/email`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...data,
        occurredAt: data.occurredAt || new Date().toISOString()
      })
    });
    return res.json();
  }

  async manualScan(previewLimit = 500) {
    const key = 'manualScan';
    this.cancelRequest(key);

    const controller = new AbortController();
    this.abortControllers.set(key, controller);

    try {
      const res = await this.fetchWithRetry(`${this.apiUrl}/api/email-scan/manual?previewLimit=${previewLimit}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.authService.getToken()}` },
        signal: controller.signal
      });
      return res.json();
    } finally {
      this.abortControllers.delete(key);
    }
  }

  async sendEmail(to, subject, body) {
    if (!to || !subject || !body) {
      throw new Error('Missing required fields: to, subject, body');
    }
    const res = await this.fetchWithRetry(`${this.apiUrl}/api/SecureEmail/send`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ to, subject, body })
    });
    return res.json();
  }

  async getTemplates() {
    const res = await this.fetchWithRetry(`${this.apiUrl}/api/email/templates`, {
      headers: { 'Authorization': `Bearer ${this.authService.getToken()}` }
    });
    return res.json();
  }

  async createTemplate(template) {
    if (!template.name || !template.subject || !template.body) {
      throw new Error('Missing required template fields');
    }
    const res = await this.fetchWithRetry(`${this.apiUrl}/api/email/templates`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(template)
    });
    return res.json();
  }

  cancelAllRequests() {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
  }
}
