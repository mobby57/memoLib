
        // Configuration sÃ©curisÃ©e
        const SECURITY_CONFIG = {
            allowedDomains: ['localhost', '127.0.0.1', 'memolib.local'],
            maxRedirects: 3,
            timeoutMs: 10000
        };

        // Validation des URLs pour prÃ©venir le phishing
        function isUrlSafe(url) {
            if (!url) return false;
            
            // URLs relatives sont sÃ»res
            if (url.startsWith('/') && !url.startsWith('//')) return true;
            
            try {
                const urlObj = new URL(url);
                const domain = urlObj.hostname.toLowerCase();
                
                return SECURITY_CONFIG.allowedDomains.includes(domain) ||
                       domain.endsWith('.memolib.local') ||
                       domain === 'localhost' ||
                       domain.startsWith('127.') ||
                       domain.startsWith('192.168.') ||
                       domain.startsWith('10.');
            } catch {
                return false;
            }
        }

        // Sanitisation des URLs
        function sanitizeUrl(url) {
            return isUrlSafe(url) ? url : '/';
        }

        // Protection contre le tabnabbing pour tous les liens externes
        function secureExternalLink(url) {
            if (!isUrlSafe(url)) {
                console.warn('URL bloquÃ©e pour sÃ©curitÃ©:', url);
                return false;
            }
            
            const link = document.createElement('a');
            link.href = url;
            link.rel = 'noopener noreferrer';
            link.target = '_blank';
            link.click();
            return true;
        }

        // GÃ©nÃ©ration de token CSRF
        function generateCSRFToken() {
            return Array.from(crypto.getRandomValues(new Uint8Array(32)))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        }

        // Configuration API sÃ©curisÃ©e
        const API_URL = (() => {
            const origin = window.location.origin;
            if (isUrlSafe(origin)) return origin;
            return 'http://localhost:5078';
        })();

        let token = null;
        let csrfToken = generateCSRFToken();

        // Mise Ã  jour des tokens CSRF
        function updateCSRFTokens() {
            csrfToken = generateCSRFToken();
            const tokens = document.querySelectorAll('input[name="csrf_token"]');
            tokens.forEach(input => input.value = csrfToken);
        }

        // Fetch sÃ©curisÃ© avec validation
        async function secureFetch(url, options = {}) {
            if (!isUrlSafe(url)) {
                throw new Error('URL non autorisÃ©e pour des raisons de sÃ©curitÃ©');
            }

            const headers = {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken,
                ...options.headers
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), SECURITY_CONFIG.timeoutMs);

            try {
                const response = await fetch(url, {
                    ...options,
                    headers,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                return response;
            } catch (error) {
                clearTimeout(timeoutId);
                throw error;
            }
        }

        // Gestion sÃ©curisÃ©e des formulaires
        function handleRegister(event) {
            event.preventDefault();
            register();
            return false;
        }

        function handleLogin(event) {
            event.preventDefault();
            login();
            return false;
        }

        // Fonctions principales sÃ©curisÃ©es
        async function register() {
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const name = document.getElementById('reg-name').value;

            // Validation cÃ´tÃ© client
            if (!email || !password || !name) {
                showResult('reg-result', 'âŒ Tous les champs sont requis', false);
                return;
            }

            if (password.length < 8) {
                showResult('reg-result', 'âŒ Le mot de passe doit contenir au moins 8 caractÃ¨res', false);
                return;
            }

            try {
                const res = await secureFetch(`${API_URL}/api/auth/register`, {
                    method: 'POST',
                    body: JSON.stringify({ email, password, name, role: 'AVOCAT', plan: 'CABINET' })
                });
                
                const data = await res.json();
                if (res.ok) {
                    showResult('reg-result', `âœ… Compte crÃ©Ã© avec succÃ¨s! ID: ${data.id}`);
                    document.getElementById('login-email').value = email;
                    document.getElementById('login-password').value = password;
                    updateCSRFTokens();
                } else {
                    showResult('reg-result', `âŒ Erreur: ${data.message}`, false);
                }
            } catch (err) {
                showResult('reg-result', `âŒ Erreur de connexion: ${err.message}`, false);
            }
        }

        async function login() {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                showResult('login-result', 'âŒ Email et mot de passe requis', false);
                return;
            }

            try {
                const res = await secureFetch(`${API_URL}/api/auth/login`, {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });
                
                const data = await res.json();
                if (res.ok) {
                    token = data.token;
                    updateCurrentUserDisplay(email);
                    showResult('login-result', `âœ… ConnectÃ© avec succÃ¨s!`);
                    updateCSRFTokens();
                } else {
                    showResult('login-result', `âŒ Erreur: ${data.message}`, false);
                }
            } catch (err) {
                showResult('login-result', `âŒ Erreur de connexion: ${err.message}`, false);
            }
        }

        async function manualEmailScan() {
            if (!token) {
                showResult('scan-result', 'âŒ Connectez-vous d\'abord', false);
                return;
            }

            try {
                const res = await secureFetch(`${API_URL}/api/email-scan/manual`, {
                    method: 'POST'
                });
                
                const data = await res.json();
                if (res.ok) {
                    showResult('scan-result', `âœ… ${data.message}`);
                } else {
                    showResult('scan-result', `âŒ Erreur: ${data.message}`, false);
                }
            } catch (err) {
                showResult('scan-result', `âŒ Erreur: ${err.message}`, false);
            }
        }

        // Fonctions utilitaires
        function showTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
            document.getElementById(tabName + '-tab').classList.remove('hidden');
            const activeButton = Array.from(document.querySelectorAll('.tab'))
                .find(btn => btn.getAttribute('onclick') === `showTab('${tabName}')`);
            if (activeButton) activeButton.classList.add('active');
        }

        function showResult(elementId, message, isSuccess = true) {
            const el = document.getElementById(elementId);
            el.innerHTML = `<div class="result ${isSuccess ? 'success' : 'error'}">${message}</div>`;
        }

        function escapeHtml(text) {
            const value = text == null ? '' : String(text);
            const div = document.createElement('div');
            div.textContent = value;
            return div.innerHTML;
        }

        function parseRawPayloadSafe(rawPayload) {
            if (!rawPayload) return {};
            try {
                return typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
            } catch {
                return {};
            }
        }

        function extractFullBody(payload) {
            return (payload?.body || payload?.Body || payload?.bodyText || payload?.bodyHtml || '').toString();
        }

        function renderSearchEventsList(events, titleLabel, options = {}) {
            const includeFullBody = options.includeFullBody === true;
            const showIds = document.getElementById('search-show-ids')?.checked === true;

            let html = `<div class="result success">âœ… ${events.length} email(s) ${titleLabel}</div>`;
            if (includeFullBody) {
                html += '<div class="result" style="margin-top:10px;">Affichage complet activÃ©: chaque carte contient le contenu entier du mail.</div>';
            }

            html += '<div style="max-height: 520px; overflow-y: auto;">';
            events.forEach((e, index) => {
                const payload = parseRawPayloadSafe(e.rawPayload);
                const from = escapeHtml(payload?.from || payload?.From || 'ExpÃ©diteur non identifiÃ©');
                const subject = escapeHtml(payload?.subject || payload?.Subject || 'Sujet non renseignÃ©');
                const when = e?.occurredAt ? new Date(e.occurredAt).toLocaleString('fr-FR') : '-';
                const fullBody = extractFullBody(payload);
                const body = includeFullBody
                    ? fullBody
                    : (fullBody.length > 300 ? `${fullBody.substring(0, 300)}...` : fullBody);

                html += `<div class="result" style="text-align:left; margin-top:10px;">`;
                html += `<strong>#${index + 1}</strong> â€¢ ${escapeHtml(when)}<br>`;
                html += `<strong>De:</strong> ${from}<br>`;
                html += `<strong>Sujet:</strong> ${subject}<br>`;
                if (showIds) {
                    html += `<div style="font-size:12px; color:#666; margin-top:6px;">EventId: ${escapeHtml(e?.id || '')}${e?.externalId ? ` | ExternalId: ${escapeHtml(e.externalId)}` : ''}</div>`;
                }
                html += `<strong>Contenu:</strong>`;
                html += `<div style="white-space:pre-wrap; background:#fff; border:1px solid #ddd; padding:8px; border-radius:4px; margin-top:6px;">${escapeHtml(body || '(vide)')}</div>`;
                html += `</div>`;
            });
            html += '</div>';

            const container = document.getElementById('search-result');
            if (container) container.innerHTML = html;
        }

        async function searchEvents() {
            if (!token) return showResult('search-result', 'âŒ Connectez-vous d\'abord', false);

            const text = document.getElementById('search-text')?.value || '';
            const includeFullBody = document.getElementById('search-show-full-content')?.checked !== false;

            try {
                const res = await secureFetch(`${API_URL}/api/search/events`, {
                    method: 'POST',
                    body: JSON.stringify({ text, limit: 500 }),
                    timeoutMs: 60000
                });

                const data = await res.json();
                if (!res.ok) {
                    return showResult('search-result', `âŒ Erreur: ${data?.message || res.status}`, false);
                }

                if (!Array.isArray(data)) {
                    return showResult('search-result', 'âŒ Format de rÃ©ponse invalide', false);
                }

                renderSearchEventsList(data, 'trouvÃ©(s)', { includeFullBody });
            } catch (err) {
                showResult('search-result', `âŒ Erreur: ${err.message}`, false);
            }
        }

        async function loadAllReceivedEmails() {
            if (!token) return showResult('search-result', 'âŒ Connectez-vous d\'abord', false);

            const includeFullBody = document.getElementById('search-show-full-content')?.checked !== false;
            showResult('search-result', 'â³ Chargement de tous les emails reÃ§us...');

            try {
                const res = await secureFetch(`${API_URL}/api/search/events`, {
                    method: 'POST',
                    body: JSON.stringify({ text: '', returnAll: true }),
                    timeoutMs: 120000
                });

                const data = await res.json();
                if (!res.ok) {
                    return showResult('search-result', `âŒ Erreur: ${data?.message || res.status}`, false);
                }

                if (!Array.isArray(data)) {
                    return showResult('search-result', 'âŒ Format de rÃ©ponse invalide', false);
                }

                renderSearchEventsList(data, 'reÃ§u(s) (chargement complet)', { includeFullBody });
            } catch (err) {
                showResult('search-result', `âŒ Erreur: ${err.message}`, false);
            }
        }

        function updateCurrentUserDisplay(email) {
            const display = document.getElementById('currentUserDisplay');
            if (display && email) {
                display.textContent = `ðŸ‘¤ ${email}`;
            }
        }

        function openAnomalyCenter() {
            showTab('audit');
        }

        function initDemoData() {
            if (!token) {
                alert('Veuillez vous connecter d\'abord');
                return;
            }
            alert('FonctionnalitÃ© disponible aprÃ¨s connexion complÃ¨te');
        }

        // Installation PWA sÃ©curisÃ©e
        let installPromptEvent = null;

        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            installPromptEvent = event;
        });

        async function installApp() {
            if (!installPromptEvent) {
                alert('Installation non disponible ici. Utilisez le menu du navigateur: Installer l\'application.');
                return;
            }

            installPromptEvent.prompt();
            await installPromptEvent.userChoice;
            installPromptEvent = null;
        }

        // ArrÃªt sÃ©curisÃ© de l'application
        async function stopApplication() {
            try {
                const res = await secureFetch(`${API_URL}/api/system/stop`, { method: 'POST' });
                if (!res.ok) {
                    throw new Error(`ArrÃªt refusÃ© (${res.status})`);
                }
            } catch (err) {
                alert(`Erreur arrÃªt: ${err.message}`);
            }
        }

        // Event listeners sÃ©curisÃ©s
        document.getElementById('installBtn')?.addEventListener('click', async () => {
            try {
                await installApp();
            } catch (err) {
                alert(`Erreur installation: ${err.message}`);
            }
        });

        document.getElementById('stopBtn')?.addEventListener('click', async () => {
            try {
                await stopApplication();
            } catch (err) {
                alert(`Erreur arrÃªt: ${err.message}`);
            }
        });

        // Initialisation sÃ©curisÃ©e
        updateCSRFTokens();
        
        // VÃ©rification pÃ©riodique de la sÃ©curitÃ©
        setInterval(() => {
            if (document.querySelectorAll('a[href^="http"]:not([rel*="noopener"])').length > 0) {
                console.warn('Liens externes non sÃ©curisÃ©s dÃ©tectÃ©s');
            }
        }, 5000);

        console.log('ðŸ”’ MemoLib chargÃ© avec protections de sÃ©curitÃ© activÃ©es');
    
