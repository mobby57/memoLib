# 🚀 PLAN D'ACTION IMMÉDIAT - MemoLib

## ⚡ Actions Critiques (À faire MAINTENANT)

### 1. Tests Unitaires (Priorité: CRITIQUE)
```bash
# Installation
npm init -y
npm install --save-dev jest @testing-library/dom @testing-library/jest-dom

# Configuration
cat > jest.config.js << EOF
module.exports = {
  testEnvironment: 'jsdom',
  coverageThreshold: {
    global: { branches: 50, functions: 50, lines: 50 }
  }
};
EOF

# Premier test
mkdir -p __tests__
cat > __tests__/auth.test.js << EOF
describe('Authentication', () => {
  test('login should store token', async () => {
    const mockToken = 'test-token';
    localStorage.setItem('authToken', mockToken);
    expect(localStorage.getItem('authToken')).toBe(mockToken);
  });
});
EOF

# Lancer
npm test
```

### 2. TypeScript Migration (Priorité: HAUTE)
```bash
# Installation
npm install --save-dev typescript @types/node

# Configuration
cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
EOF

# Créer types
mkdir -p types
cat > types/api.ts << EOF
export interface Case {
  id: string;
  title: string;
  clientId?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
EOF
```

### 3. Modularisation JavaScript (Priorité: HAUTE)
```bash
# Structure
mkdir -p wwwroot/js/{services,utils,components}

# Service Auth
cat > wwwroot/js/services/auth.js << EOF
export class AuthService {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
  }

  async login(email, password) {
    const res = await fetch(\`\${this.apiUrl}/api/auth/login\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('authToken', data.token);
      return { success: true, token: data.token };
    }
    return { success: false, error: data.message };
  }

  getToken() {
    return localStorage.getItem('authToken');
  }

  logout() {
    localStorage.removeItem('authToken');
  }
}
EOF

# Service Cases
cat > wwwroot/js/services/cases.js << EOF
export class CaseService {
  constructor(apiUrl, authService) {
    this.apiUrl = apiUrl;
    this.authService = authService;
  }

  async getCases() {
    const res = await fetch(\`\${this.apiUrl}/api/cases\`, {
      headers: { 'Authorization': \`Bearer \${this.authService.getToken()}\` }
    });
    return res.json();
  }

  async getCaseById(id) {
    const res = await fetch(\`\${this.apiUrl}/api/cases/\${id}\`, {
      headers: { 'Authorization': \`Bearer \${this.authService.getToken()}\` }
    });
    return res.json();
  }
}
EOF

# Utils
cat > wwwroot/js/utils/helpers.js << EOF
export const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const formatDate = (date) => {
  return new Date(date).toLocaleString('fr-FR');
};

export const showNotification = (message, type = 'info') => {
  // Implementation
};
EOF
```

### 4. Performance Optimizations (Priorité: HAUTE)
```javascript
// wwwroot/js/utils/performance.js
export class PerformanceOptimizer {
  // Lazy loading images
  static lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          observer.unobserve(img);
        }
      });
    });
    images.forEach(img => observer.observe(img));
  }

  // Debounced search
  static createDebouncedSearch(searchFn, delay = 300) {
    let timer;
    return (query) => {
      clearTimeout(timer);
      timer = setTimeout(() => searchFn(query), delay);
    };
  }

  // Pagination
  static paginate(items, page = 1, limit = 20) {
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      items: items.slice(start, end),
      total: items.length,
      page,
      pages: Math.ceil(items.length / limit)
    };
  }
}
```

### 5. Accessibilité (Priorité: MOYENNE)
```javascript
// wwwroot/js/utils/accessibility.js
export class AccessibilityHelper {
  // Ajouter ARIA labels
  static enhanceButtons() {
    document.querySelectorAll('button:not([aria-label])').forEach(btn => {
      const text = btn.textContent.trim();
      if (text) btn.setAttribute('aria-label', text);
    });
  }

  // Navigation clavier
  static enableKeyboardNav() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.querySelector('.modal[style*="display: block"]');
        if (modal) modal.style.display = 'none';
      }
    });
  }

  // Focus trap dans modals
  static trapFocus(modalElement) {
    const focusable = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    modalElement.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }
}
```

### 6. Refactoring demo.html (Priorité: HAUTE)
```html
<!-- wwwroot/demo-refactored.html -->
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>MemoLib - Refactored</title>
    <link rel="stylesheet" href="css/memolib-theme.css">
</head>
<body>
    <div id="app"></div>

    <!-- Modules ES6 -->
    <script type="module">
        import { AuthService } from './js/services/auth.js';
        import { CaseService } from './js/services/cases.js';
        import { PerformanceOptimizer } from './js/utils/performance.js';
        import { AccessibilityHelper } from './js/utils/accessibility.js';

        const API_URL = 'http://localhost:5078';
        
        // Initialize services
        const authService = new AuthService(API_URL);
        const caseService = new CaseService(API_URL, authService);

        // Initialize optimizations
        PerformanceOptimizer.lazyLoadImages();
        AccessibilityHelper.enhanceButtons();
        AccessibilityHelper.enableKeyboardNav();

        // App initialization
        async function init() {
            const token = authService.getToken();
            if (token) {
                const cases = await caseService.getCases();
                renderCases(cases);
            } else {
                renderLoginForm();
            }
        }

        function renderLoginForm() {
            document.getElementById('app').innerHTML = `
                <form id="loginForm">
                    <input type="email" id="email" required>
                    <input type="password" id="password" required>
                    <button type="submit">Connexion</button>
                </form>
            `;

            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const result = await authService.login(email, password);
                if (result.success) {
                    init();
                }
            });
        }

        function renderCases(cases) {
            const html = cases.map(c => `
                <div class="case-card">
                    <h3>${c.title}</h3>
                    <p>${c.status}</p>
                </div>
            `).join('');
            document.getElementById('app').innerHTML = html;
        }

        init();
    </script>
</body>
</html>
```

---

## 📋 Checklist Immédiate

### Aujourd'hui (2h)
- [ ] Créer structure dossiers (services, utils, components)
- [ ] Extraire AuthService de demo.html
- [ ] Extraire CaseService de demo.html
- [ ] Ajouter debounce sur recherche

### Cette semaine (1 jour)
- [ ] Installer Jest + écrire 10 tests
- [ ] Configurer TypeScript
- [ ] Créer types API principaux
- [ ] Ajouter pagination (limit=20)

### Ce mois (1 semaine)
- [ ] Migrer toutes les fonctions vers services
- [ ] Atteindre 50% couverture tests
- [ ] Implémenter lazy loading images
- [ ] Ajouter ARIA labels partout

---

## 🎯 Métriques de Succès

| Métrique | Actuel | Cible 1 mois | Cible 3 mois |
|----------|--------|--------------|--------------|
| **Tests coverage** | 0% | 50% | 80% |
| **TypeScript** | 0% | 30% | 100% |
| **Lighthouse Score** | 70 | 85 | 95 |
| **Bundle size** | N/A | <500KB | <300KB |
| **Time to Interactive** | 3s | 2s | 1s |

---

## 🚀 Quick Wins (30 min chacun)

### 1. Ajouter Variables CSS
```css
/* wwwroot/css/variables.css */
:root {
  --primary: #667eea;
  --secondary: #764ba2;
  --success: #28a745;
  --danger: #dc3545;
  --warning: #ff9800;
  --gray-50: #f8f9fa;
  --gray-600: #666;
  --radius: 8px;
  --shadow: 0 2px 10px rgba(0,0,0,0.1);
}
```

### 2. Ajouter Loading States
```javascript
function showLoading(elementId) {
  document.getElementById(elementId).innerHTML = 
    '<div class="spinner">⏳ Chargement...</div>';
}

function hideLoading(elementId) {
  document.getElementById(elementId).querySelector('.spinner')?.remove();
}
```

### 3. Ajouter Error Boundary
```javascript
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  showNotification('Une erreur est survenue', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise:', e.reason);
  showNotification('Erreur de connexion', 'error');
});
```

---

## 📞 Support

Questions: support@memolib.com

**Dernière mise à jour**: 2025-01-30
