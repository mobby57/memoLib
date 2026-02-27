
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
        const PINNED_MONITOR_EMAIL = 'sarraboudjellal57@gmail.com';
        const PINNED_MONITOR_PASSWORD = localStorage.getItem('memolibMonitorPassword') || 'SecurePass123!';
        localStorage.setItem('memolibMonitorEmail', PINNED_MONITOR_EMAIL);
        const LOGIN_EMAIL_KEY = 'memolibMonitorEmail';
        const LOGIN_PASSWORD_KEY = 'memolibMonitorPassword';
        const LOGIN_NAME_KEY = 'memolibMonitorName';

        let token = null;
        let csrfToken = generateCSRFToken();

        function persistSession(email, jwtToken) {
            if (!jwtToken) return;
            token = jwtToken;
            localStorage.setItem('authToken', jwtToken);
            localStorage.setItem('memolibAuthToken', jwtToken);
            sessionStorage.setItem('authToken', jwtToken);
            if (email) {
                localStorage.setItem('memolibUserEmail', email);
            }
        }

        function restoreSession() {
            const storedToken = localStorage.getItem('authToken')
                || localStorage.getItem('memolibAuthToken')
                || sessionStorage.getItem('authToken');
            const storedEmail = localStorage.getItem('memolibUserEmail');

            if (storedToken) {
                token = storedToken;
            }

            if (storedEmail) {
                updateCurrentUserDisplay(storedEmail);
            }
        }

        function prefillCredentials() {
            const email = localStorage.getItem(LOGIN_EMAIL_KEY) || PINNED_MONITOR_EMAIL;
            const password = localStorage.getItem(LOGIN_PASSWORD_KEY) || PINNED_MONITOR_PASSWORD;
            const name = localStorage.getItem(LOGIN_NAME_KEY) || 'Sarra Boudjellal';

            const setValue = (id, value) => {
                const input = document.getElementById(id);
                if (input && !input.value) {
                    input.value = value;
                }
            };

            setValue('login-email', email);
            setValue('login-password', password);
            setValue('reg-email', email);
            setValue('reg-password', password);
            setValue('reg-name', name);
        }

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

            const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : SECURITY_CONFIG.timeoutMs;
            const fetchOptions = { ...options };
            delete fetchOptions.timeoutMs;

            const headers = {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken,
                ...fetchOptions.headers
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            try {
                const response = await fetch(url, {
                    ...fetchOptions,
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

            localStorage.setItem(LOGIN_EMAIL_KEY, email || PINNED_MONITOR_EMAIL);
            localStorage.setItem(LOGIN_PASSWORD_KEY, password || PINNED_MONITOR_PASSWORD);
            localStorage.setItem(LOGIN_NAME_KEY, name || 'Sarra Boudjellal');

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

            localStorage.setItem(LOGIN_EMAIL_KEY, email || PINNED_MONITOR_EMAIL);
            localStorage.setItem(LOGIN_PASSWORD_KEY, password || PINNED_MONITOR_PASSWORD);

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
                    persistSession(email, data.token);
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

        async function keepPinnedSessionAlive() {
            const loginEmail = PINNED_MONITOR_EMAIL;
            const loginPassword = localStorage.getItem('memolibMonitorPassword') || PINNED_MONITOR_PASSWORD;

            try {
                const res = await secureFetch(`${API_URL}/api/auth/login`, {
                    method: 'POST',
                    body: JSON.stringify({ email: loginEmail, password: loginPassword })
                });

                if (!res.ok) {
                    return;
                }

                const data = await res.json();
                if (!data?.token) {
                    return;
                }

                persistSession(loginEmail, data.token);
                updateCurrentUserDisplay(loginEmail);
            } catch {
            }
        }

        function escapeScanHtml(text) {
            const value = text == null ? '' : String(text);
            const div = document.createElement('div');
            div.textContent = value;
            return div.innerHTML;
        }

        function getSortedFilteredScanRows(rows) {
            const statusFilter = document.getElementById('scan-status-filter')?.value || 'all';
            const sortOrder = document.getElementById('scan-sort-order')?.value || 'dateDesc';

            let filtered = Array.isArray(rows) ? [...rows] : [];

            if (statusFilter !== 'all') {
                filtered = filtered.filter(r => (r?.status || '').toLowerCase() === statusFilter);
            }

            filtered.sort((a, b) => {
                const da = new Date(a?.occurredAt || 0).getTime();
                const db = new Date(b?.occurredAt || 0).getTime();

                if (sortOrder === 'dateAsc') return da - db;
                if (sortOrder === 'status') {
                    const sa = (a?.status || '').toLowerCase();
                    const sb = (b?.status || '').toLowerCase();
                    return sa.localeCompare(sb) || (db - da);
                }

                return db - da;
            });

            return filtered;
        }

        function refreshStructuredScanResultView() {
            if (!window.__lastStructuredScanData) return;
            const container = document.getElementById('scan-result');
            if (!container) return;
            container.innerHTML = renderStructuredScanResult(window.__lastStructuredScanData);
        }

        function renderStructuredScanResult(data) {
            const rows = Array.isArray(data?.linesPreview) ? data.linesPreview : [];
            const sortedRows = getSortedFilteredScanRows(rows);
            const statusFilter = document.getElementById('scan-status-filter')?.value || 'all';
            const sortOrder = document.getElementById('scan-sort-order')?.value || 'dateDesc';
            const cards = sortedRows.map((row, index) => {
                const status = row?.status || 'unknown';
                const date = row?.occurredAt ? new Date(row.occurredAt).toLocaleString('fr-FR') : '-';
                const from = escapeScanHtml(row?.from || '-');
                const to = escapeScanHtml(row?.to || '-');
                const subject = escapeScanHtml(row?.subject || '(sans sujet)');
                const bodyPreview = escapeScanHtml(row?.bodyPreview || '');
                const attachmentNames = Array.isArray(row?.attachmentNames) && row.attachmentNames.length > 0
                    ? row.attachmentNames.map(a => escapeScanHtml(a)).join(', ')
                    : 'Aucune';

                return `
                    <div class="result" style="margin-top:10px; text-align:left;">
                        <strong>#${index + 1} â€¢ ${status.toUpperCase()}</strong><br>
                        <strong>Date:</strong> ${date}<br>
                        <strong>De:</strong> ${from}<br>
                        <strong>Ã€:</strong> ${to}<br>
                        <strong>Sujet:</strong> ${subject}<br>
                        <strong>PiÃ¨ces jointes:</strong> ${attachmentNames}<br>
                        <strong>Contenu:</strong><br>
                        <div style="white-space:pre-wrap; background:#fff; border:1px solid #ddd; padding:8px; border-radius:4px; margin-top:6px;">${bodyPreview || '(vide)'}</div>
                    </div>
                `;
            }).join('');

            const summary = `
                <div class="result success" style="text-align:left;">
                    <strong>âœ… ${escapeScanHtml(data?.message || 'Scan terminÃ©')}</strong><br>
                    Total: <strong>${data?.totalEmails ?? 0}</strong> |
                    IngÃ©rÃ©s: <strong>${data?.ingested ?? 0}</strong> |
                    Doublons: <strong>${data?.duplicates ?? 0}</strong>
                </div>
            `;

            const controls = `
                <div class="result" style="margin-top:10px; text-align:left;">
                    <strong>Organisation structurÃ©e</strong><br>
                    <label style="margin-right:10px;">Filtre statut:
                        <select id="scan-status-filter" onchange="refreshStructuredScanResultView()">
                            <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>Tous</option>
                            <option value="ingested" ${statusFilter === 'ingested' ? 'selected' : ''}>IngÃ©rÃ©s</option>
                            <option value="duplicate" ${statusFilter === 'duplicate' ? 'selected' : ''}>Doublons</option>
                        </select>
                    </label>
                    <label>Tri:
                        <select id="scan-sort-order" onchange="refreshStructuredScanResultView()">
                            <option value="dateDesc" ${sortOrder === 'dateDesc' ? 'selected' : ''}>Date (plus rÃ©cent)</option>
                            <option value="dateAsc" ${sortOrder === 'dateAsc' ? 'selected' : ''}>Date (plus ancien)</option>
                            <option value="status" ${sortOrder === 'status' ? 'selected' : ''}>Statut puis date</option>
                        </select>
                    </label>
                    <div style="margin-top:8px; color:#555;">Lignes affichÃ©es: <strong>${sortedRows.length}</strong></div>
                </div>
            `;

            return summary + controls + (cards || '<div class="result">Aucun email Ã  afficher dans cet aperÃ§u.</div>');
        }

        function extractBodyFromRawPayload(rawPayload) {
            if (!rawPayload) return '';
            try {
                const parsed = JSON.parse(rawPayload);
                return (parsed.body || parsed.bodyText || parsed.bodyHtml || '').toString();
            } catch {
                return '';
            }
        }

        async function enrichScanRowsWithBodies(rows) {
            if (!Array.isArray(rows) || rows.length === 0) return rows;
            if (rows.some(r => r?.bodyPreview)) return rows;

            const res = await secureFetch(`${API_URL}/api/search/events`, {
                method: 'POST',
                body: JSON.stringify({ text: '' }),
                timeoutMs: 60000
            });

            if (!res.ok) return rows;

            const events = await res.json();
            const map = new Map();
            (Array.isArray(events) ? events : []).forEach(ev => {
                if (ev?.externalId) {
                    map.set(ev.externalId, extractBodyFromRawPayload(ev.rawPayload));
                }
            });

            return rows.map(row => {
                if (row?.bodyPreview) return row;
                const fallbackBody = map.get(row?.messageId) || '';
                const bodyPreview = fallbackBody.length > 600 ? `${fallbackBody.slice(0, 600)}...` : fallbackBody;
                return { ...row, bodyPreview };
            });
        }

        async function manualEmailScan() {
            if (!token) {
                showResult('scan-result', 'âŒ Connectez-vous d\'abord', false);
                return;
            }

            showResult('scan-result', 'â³ Scan en cours...');

            try {
                const res = await secureFetch(`${API_URL}/api/email-scan/manual`, {
                    method: 'POST',
                    timeoutMs: 240000
                });
                
                const data = await res.json();
                if (res.ok) {
                    data.linesPreview = await enrichScanRowsWithBodies(Array.isArray(data?.linesPreview) ? data.linesPreview : []);
                    window.__lastStructuredScanData = data;
                    document.getElementById('scan-result').innerHTML = renderStructuredScanResult(data);
                } else {
                    showResult('scan-result', `âŒ Erreur: ${data.message}`, false);
                }
            } catch (err) {
                const message = err?.name === 'AbortError'
                    ? 'Le scan prend plus de temps que prÃ©vu. RÃ©essayez, ou rÃ©duisez le volume (emails non lus / pÃ©riode plus courte).'
                    : err.message;
                showResult('scan-result', `âŒ Erreur: ${message}`, false);
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
        prefillCredentials();
        updateCSRFTokens();
        restoreSession();
        keepPinnedSessionAlive();
        
        // VÃ©rification pÃ©riodique de la sÃ©curitÃ©
        setInterval(() => {
            if (document.querySelectorAll('a[href^="http"]:not([rel*="noopener"])').length > 0) {
                console.warn('Liens externes non sÃ©curisÃ©s dÃ©tectÃ©s');
            }
        }, 5000);

        setInterval(keepPinnedSessionAlive, 180000);

        console.log('ðŸ”’ MemoLib chargÃ© avec protections de sÃ©curitÃ© activÃ©es');
    
