export class AuthService {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
  }

  async parseJsonFromTextResponse(res) {
    const text = await res.text();
    if (!text || text.trim() === '') return null;

    try {
      return JSON.parse(text);
    } catch {
      throw new Error('Invalid server response');
    }
  }

  async login(email, password) {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    try {
      const res = await fetch(`${this.apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const error = await res.text();
        return { success: false, error: error || 'Login failed' };
      }

      const data = await this.parseJsonFromTextResponse(res);
      if (!data) {
        return { success: false, error: 'Empty response' };
      }

      if (data.token) {
        this.setToken(data.token);
        return { success: true, token: data.token };
      }

      return { success: false, error: 'No token received' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  async register(email, password, name, role = 'AVOCAT') {
    try {
      const res = await fetch(`${this.apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role, plan: 'CABINET' })
      });

      const data = await this.parseJsonFromTextResponse(res);
      if (res.ok) {
        return { success: true, data };
      }

      return { success: false, error: data?.message || 'Registration failed' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  setToken(token) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('memolibAuthToken', token);
    sessionStorage.setItem('authToken', token);
  }

  getToken() {
    return localStorage.getItem('authToken') ||
           localStorage.getItem('memolibAuthToken') ||
           sessionStorage.getItem('authToken');
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('memolibAuthToken');
    sessionStorage.removeItem('authToken');
  }

  isAuthenticated() {
    return !!this.getToken();
  }
}
