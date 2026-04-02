#!/usr/bin/env pwsh

Write-Host "📱 INSTALLATION APPLICATION MOBILE" -ForegroundColor Cyan

# 1. PWA Manifest
$manifest = @'
{
  "name": "MemoLib - Gestion Emails Avocats",
  "short_name": "MemoLib",
  "description": "Application de gestion des emails pour cabinets d'avocats",
  "start_url": "/demo.html",
  "display": "standalone",
  "background_color": "#667eea",
  "theme_color": "#667eea",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512.png", 
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
'@

$manifestPath = "../wwwroot/manifest.json"
Set-Content -Path $manifestPath -Value $manifest -Encoding UTF8

# 2. Service Worker
$serviceWorker = @'
const CACHE_NAME = 'memolib-v1';
const urlsToCache = [
  '/demo.html',
  '/dashboard.html',
  '/export.html',
  '/notification-widget.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Notifications push
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nouvelle notification MemoLib',
    icon: 'icon-192.png',
    badge: 'icon-192.png'
  };

  event.waitUntil(
    self.registration.showNotification('MemoLib', options)
  );
});
'@

$swPath = "../wwwroot/sw.js"
Set-Content -Path $swPath -Value $serviceWorker -Encoding UTF8

# 3. App mobile responsive
$mobileApp = @'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MemoLib Mobile</title>
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#667eea">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; }
        
        .mobile-header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 20px 15px; 
            position: sticky; 
            top: 0; 
            z-index: 100;
        }
        
        .mobile-nav { 
            display: flex; 
            justify-content: space-around; 
            background: white; 
            padding: 10px 0; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .nav-item { 
            text-align: center; 
            padding: 10px; 
            cursor: pointer; 
            border-radius: 10px;
            transition: background 0.2s;
        }
        
        .nav-item:hover, .nav-item.active { 
            background: #f0f0f0; 
        }
        
        .content { 
            padding: 20px 15px; 
        }
        
        .card { 
            background: white; 
            border-radius: 15px; 
            padding: 20px; 
            margin-bottom: 15px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .stat-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
            margin-bottom: 20px;
        }
        
        .stat-card { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 20px; 
            border-radius: 15px; 
            text-align: center;
        }
        
        .stat-number { 
            font-size: 2em; 
            font-weight: bold; 
        }
        
        .btn { 
            background: #667eea; 
            color: white; 
            border: none; 
            padding: 15px 20px; 
            border-radius: 10px; 
            width: 100%; 
            font-size: 16px; 
            cursor: pointer;
            margin: 10px 0;
        }
        
        .btn:active { 
            background: #5568d3; 
        }
        
        .hidden { 
            display: none; 
        }
        
        @media (max-width: 480px) {
            .mobile-header { padding: 15px 10px; }
            .content { padding: 15px 10px; }
            .card { padding: 15px; }
        }
    </style>
</head>
<body>
    <div class="mobile-header">
        <h1>📱 MemoLib Mobile</h1>
        <p>Gestion emails avocats</p>
    </div>

    <div class="mobile-nav">
        <div class="nav-item active" onclick="showSection('dashboard')">
            📊<br>Dashboard
        </div>
        <div class="nav-item" onclick="showSection('cases')">
            📁<br>Dossiers
        </div>
        <div class="nav-item" onclick="showSection('notifications')">
            🔔<br>Alertes
        </div>
        <div class="nav-item" onclick="showSection('profile')">
            👤<br>Profil
        </div>
    </div>

    <div class="content">
        <!-- Dashboard Section -->
        <div id="dashboard-section">
            <div class="stat-grid" id="statsGrid">
                <!-- Stats dynamiques -->
            </div>
            
            <div class="card">
                <h3>Actions rapides</h3>
                <button class="btn" onclick="scanEmails()">📧 Scanner emails</button>
                <button class="btn" onclick="viewCases()">📁 Voir dossiers</button>
                <button class="btn" onclick="exportData()">📤 Exporter</button>
            </div>
        </div>

        <!-- Cases Section -->
        <div id="cases-section" class="hidden">
            <div class="card">
                <h3>Mes dossiers</h3>
                <div id="casesList">Chargement...</div>
            </div>
        </div>

        <!-- Notifications Section -->
        <div id="notifications-section" class="hidden">
            <div class="card">
                <h3>Notifications</h3>
                <div id="notificationsList">Chargement...</div>
            </div>
        </div>

        <!-- Profile Section -->
        <div id="profile-section" class="hidden">
            <div class="card">
                <h3>Mon profil</h3>
                <p>Email: <span id="userEmail">-</span></p>
                <button class="btn" onclick="logout()">🚪 Déconnexion</button>
            </div>
        </div>
    </div>

    <script>
        const API_URL = 'http://localhost:5078';
        let token = localStorage.getItem('memolib_token');

        // PWA Installation
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
        }

        function showSection(section) {
            document.querySelectorAll('[id$="-section"]').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            
            document.getElementById(section + '-section').classList.remove('hidden');
            event.target.closest('.nav-item').classList.add('active');
            
            if (section === 'dashboard') loadDashboard();
            if (section === 'cases') loadCases();
            if (section === 'notifications') loadNotifications();
        }

        async function loadDashboard() {
            try {
                const response = await fetch(`${API_URL}/api/dashboard/realtime`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!response.ok) return;
                
                const stats = await response.json();
                document.getElementById('statsGrid').innerHTML = `
                    <div class="stat-card">
                        <div class="stat-number">${stats.totalCases}</div>
                        <div>Dossiers</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${stats.totalEvents}</div>
                        <div>Emails</div>
                    </div>
                `;
            } catch (error) {
                console.error('Erreur dashboard:', error);
            }
        }

        async function loadCases() {
            try {
                const response = await fetch(`${API_URL}/api/cases`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!response.ok) return;
                
                const cases = await response.json();
                const list = document.getElementById('casesList');
                
                if (cases.length === 0) {
                    list.innerHTML = '<p>Aucun dossier</p>';
                    return;
                }
                
                list.innerHTML = cases.slice(0, 5).map(c => `
                    <div style="padding: 10px; border-bottom: 1px solid #eee;">
                        <strong>${c.title}</strong><br>
                        <small>${new Date(c.createdAt).toLocaleDateString()}</small>
                    </div>
                `).join('');
            } catch (error) {
                document.getElementById('casesList').innerHTML = '<p>Erreur de chargement</p>';
            }
        }

        async function loadNotifications() {
            document.getElementById('notificationsList').innerHTML = '<p>Aucune notification</p>';
        }

        function scanEmails() {
            alert('Scan des emails en cours...');
        }

        function viewCases() {
            showSection('cases');
        }

        function exportData() {
            window.open('/export.html', '_blank');
        }

        function logout() {
            localStorage.removeItem('memolib_token');
            window.location.reload();
        }

        // Chargement initial
        loadDashboard();
    </script>
</body>
</html>
'@

$mobileHtmlPath = "../wwwroot/mobile.html"
Set-Content -Path $mobileHtmlPath -Value $mobileApp -Encoding UTF8

Write-Host "✅ Application mobile installée!" -ForegroundColor Green
Write-Host "📱 Accès: http://localhost:5078/mobile.html" -ForegroundColor Cyan
Write-Host "💡 Ajoutez à l'écran d'accueil pour une expérience native" -ForegroundColor Yellow