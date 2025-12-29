class AuthService {
  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  async login(credentials) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) throw new Error('Login failed');
    
    const { accessToken, refreshToken } = await response.json();
    this.setTokens(accessToken, refreshToken);
    return { accessToken, refreshToken };
  }

  async refreshAccessToken() {
    if (!this.refreshToken) throw new Error('No refresh token');
    
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.refreshToken}` }
    });
    
    if (!response.ok) throw new Error('Token refresh failed');
    
    const { accessToken } = await response.json();
    this.setTokens(accessToken, this.refreshToken);
    return accessToken;
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  getAuthHeaders() {
    return this.accessToken ? { 'Authorization': `Bearer ${this.accessToken}` } : {};
  }
}

export const authService = new AuthService();